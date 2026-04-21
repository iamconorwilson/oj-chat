import ws from 'ws';
import { EventEmitter } from 'events';
import { TwitchProvider } from '../../providers/twitch/api.js';

interface Emote {
    id: string;
    name: string;
    source: string;
}

export class EmoteCache extends EventEmitter {
    private static instance: EmoteCache;
    private emotes: Emote[] = [];
    private base7tvUrl: string | undefined = process.env.SEVENTV_API_ENDPOINT;
    private base7tvWsUrl: string | undefined = process.env.SEVENTV_WS_ENDPOINT;
    private emoteSetId: string = '';
    private userId: string = '';
    private ws?: ws;
    private wsConnected: boolean = false;
    private wsErrorHandler?: (err: unknown) => void;
    private sendQueue: WeakMap<ws, string[]> = new WeakMap();

    private isConnecting: boolean = false;

    private constructor() {
        super();
        this.on('error', (err) => {
            console.warn('EmoteCache caught error:', err);
        });
    }

    public static async getInstance(): Promise<EmoteCache> {
        if (!EmoteCache.instance) {
            EmoteCache.instance = new EmoteCache();
            await EmoteCache.instance.initialize();
        }
        return EmoteCache.instance;
    }

    public static hasInstance(): boolean {
        return !!EmoteCache.instance;
    }

    private async initialize(): Promise<void> {
        if (!this.base7tvUrl || !this.base7tvWsUrl) return console.error('7TV API endpoint or WebSocket endpoint is not defined in environment variables.');
        const client = await TwitchProvider.getInstance();
        this.userId = client.me ? client.me.id : '';
        if (!this.userId) {
            console.error('Cannot initialize EmoteCache: User ID is not available.');
            return;
        }
        await this.refreshEmoteCache();
        console.log('7TV WebSocket listener is ready to connect');
        this.emit('ready');
    }

    public getEmotes(): Emote[] {
        return this.emotes;
    }

    public async refreshEmoteCache(): Promise<void> {
        const channelEmotes = await this.fetchChannelEmotes(this.userId);
        const globalEmotes = await this.fetchGlobalEmotes();
        this.emotes = [...channelEmotes, ...globalEmotes];
        this.emit('cacheRefreshed', this.emotes);
    }

    private addEmoteToCache(emote: Emote): void {
        this.emotes.push(emote);
        this.emit('emoteAdded', emote);
    }

    private removeEmoteFromCache(emoteId: string): void {
        this.emotes = this.emotes.filter(emote => emote.id !== emoteId);
        this.emit('emoteRemoved', emoteId);
    }

    private async fetchChannelEmotes(channelId: string): Promise<Emote[]> {
        const response = await fetch(`${this.base7tvUrl}/users/twitch/${channelId}`);
        if (!response.ok) {
            console.error(`Failed to fetch 7TV emotes for channel ID ${channelId}: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        this.emoteSetId = data.emote_set.id;
        return data.emote_set.emotes.map((emote: { id: string, name: string }) => ({
            id: emote.id,
            name: emote.name,
            source: '7TV'
        }));
    }

    private async fetchGlobalEmotes(): Promise<Emote[]> {
        const response = await fetch(`${this.base7tvUrl}/emote-sets/global`);
        if (!response.ok) {
            console.error(`Failed to fetch global 7TV emotes: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        return data.emotes.map((emote: { id: string, name: string }) => ({
            id: emote.id,
            name: emote.name,
            source: '7TV'
        }));
    }

    private sendOrQueue(socket: ws | undefined, payload: string): void {
        if (!socket) return;
        const READY_OPEN = 1;
        try {
            if (socket.readyState === READY_OPEN) {
                socket.send(payload);
                return;
            }
        } catch (e) {
            console.error('Error sending payload via WebSocket, adding to queue', e);
        }

        let q = this.sendQueue.get(socket);
        if (!q) {
            q = [];
            this.sendQueue.set(socket, q);
            const onOpen = () => {
                try {
                    while (q!.length && socket.readyState === READY_OPEN) {
                        socket.send(q!.shift()!);
                    }
                } finally {
                    socket.removeListener('open', onOpen);
                    this.sendQueue.delete(socket);
                }
            };
            socket.on('open', onOpen);
        }
        q.push(payload);
    }

    public connect(): void {
        if (!this.base7tvWsUrl) {
            this.emit('error', new Error('7TV WebSocket endpoint is not defined in environment variables.'));
            return;
        }
        if (this.wsConnected || this.isConnecting) return;

        // Clean up previous socket
        if (this.ws) {
            try {
                if (this.wsErrorHandler) {
                    try { this.ws.removeListener('error', this.wsErrorHandler); } catch (e) {
                        console.warn('Failed to remove old WebSocket error listener:', e);
                    }
                    this.wsErrorHandler = undefined;
                }
                const swallowError = (err: unknown) => {
                    console.warn('Suppressed WebSocket error during cleanup:', err);
                };
                this.ws.once('error', swallowError);
                try {
                    this.ws.terminate?.();
                } catch (terminateErr) {
                    console.warn('WebSocket.terminate threw during cleanup:', terminateErr);
                }
            } catch (e) {
                console.error('Error cleaning up previous WebSocket:', e);
            }
            this.ws = undefined;
        }

        this.isConnecting = true;
        this.ws = new ws(this.base7tvWsUrl);
        this.wsErrorHandler = (error: unknown) => {
            this.isConnecting = false;
            this.emit('error', error);
        };
        this.ws.on('error', this.wsErrorHandler);
        const payload = {
            op: 35,
            d: {
                type: 'emote_set.update',
                condition: { object_id: this.emoteSetId }
            }
        };
        this.ws.on('open', () => {
            this.wsConnected = true;
            this.isConnecting = false;
            // use sendOrQueue to avoid sending while still CONNECTING
            this.sendOrQueue(this.ws, JSON.stringify(payload));
            this.emit('connected');
            console.log('Connected to 7TV WebSocket');
            // Refresh cache on connect
            this.refreshEmoteCache();
        });
        this.ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.op === 0 && msg.d.type === 'emote_set.update') {
                const body = msg.d.body;
                if (body.pushed) {
                    body.pushed.forEach((data: { value: { id: string, name: string } }) => {
                        this.addEmoteToCache({
                            id: data.value.id,
                            name: data.value.name,
                            source: '7TV'
                        });
                    });
                }
                if (body.pulled) {
                    body.pulled.forEach((data: { old_value: { id: string } }) => {
                        if (!data.old_value) return;
                        this.removeEmoteFromCache(data.old_value.id);
                    });
                }
            }
        });
        this.ws.on('close', () => {
            this.wsConnected = false;
            this.isConnecting = false;
            this.emit('closed');
        });
        this.ws.on('error', (error) => {
            this.isConnecting = false;
            this.emit('error', error);
        });
    }

    public disconnect(): void {
        if (this.ws && this.wsConnected) {
            this.ws.close();
            this.wsConnected = false;
            console.log('7TV WebSocket disconnected');
        }
    }

    public reconnect(): void {
        this.disconnect();
        this.connect();
    }

    public isConnected(): boolean {
        return this.wsConnected;
    }

    public setEmoteSetId(emoteSetId: string): void {
        this.emoteSetId = emoteSetId;
    }

}

