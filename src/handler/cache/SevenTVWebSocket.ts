
import ws from 'ws';
import { EventEmitter } from 'events';

export class SevenTVWebSocket extends EventEmitter {
    private static instance: SevenTVWebSocket;
    private ws?: ws;
    private baseWsUrl: string | undefined = process.env.SEVENTV_WS_ENDPOINT;
    private emoteSetId: string = '';
    private connection: boolean = false;

    private constructor() {
        super();
    }

    public static getInstance(): SevenTVWebSocket {
        if (!SevenTVWebSocket.instance) {
            SevenTVWebSocket.instance = new SevenTVWebSocket();
        }
        return SevenTVWebSocket.instance;
    }

    public connect(): void {
        if (!this.baseWsUrl) {
            this.emit('error', new Error('7TV WebSocket endpoint is not defined in environment variables.'));
            return;
        }
        
        this.ws = new ws(this.baseWsUrl);
        const payload = {
            op: 35,
            d: {
                type: 'emote_set.update',
                condition: { object_id: this.emoteSetId }
            }
        };
        this.ws.on('open', () => {
            this.connection = true;
            this.ws?.send(JSON.stringify(payload));
            this.emit('connected');
        });
        this.ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.op === 0 && msg.d.type === 'emote_set.update') {
                const body = msg.d.body;
                if (body.pushed) {
                    body.pushed.forEach((data: { value: { id: string, name: string } }) => {
                        this.emit('emoteAdded', {
                            id: data.value.id,
                            name: data.value.name,
                            source: '7TV'
                        });
                    });
                }
                if (body.pulled) {
                    body.pulled.forEach((data: { old_value: { id: string } }) => {
                        if (!data.old_value) return;
                        this.emit('emoteRemoved', data.old_value.id);
                    });
                }
            }
        });
        this.ws.on('close', () => {
            this.connection = false;
            this.emit('closed');
        });
        this.ws.on('error', (error) => {
            this.emit('error', error);
        });
    }

    public disconnect(): void {
        if (this.ws && this.connection) {
            this.ws.close();
            this.connection = false;
        }
    }

    public reconnect(): void {
        this.disconnect();
        this.connect();
    }

    public setEmoteSetId(emoteSetId: string): void {
        this.emoteSetId = emoteSetId;
    }

    public isConnected(): boolean {
        return this.connection;
    }
}
