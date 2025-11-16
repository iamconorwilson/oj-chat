import { SevenTVWebSocket } from './SevenTVWebSocket.js';
import { TwitchProvider } from '../../api/twitch.js';

interface Emote {
    id: string;
    name: string;
    source: string;
}

export class EmoteCache {

    private emotes: Emote[] = [];
    private base7tvUrl: string | undefined = process.env.SEVENTV_API_ENDPOINT;
    private base7tvWsUrl: string | undefined = process.env.SEVENTV_WS_ENDPOINT;
    private emoteSetId: string = '';
    private userId: string = '';

    private static instance: EmoteCache;

    private seventvWs: SevenTVWebSocket | undefined;

    public getSevenTVWebSocket(): SevenTVWebSocket | undefined {
        return this.seventvWs;
    }

    private constructor() {
        this.initialize();
    }

    public static getInstance(): EmoteCache {
        if (!EmoteCache.instance) {
            EmoteCache.instance = new EmoteCache();
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
        const channelEmotes = this.fetch7tvChannelEmotes(this.userId);
        const globalEmotes = this.fetch7tvGlobalEmotes();
        Promise.all([channelEmotes, globalEmotes]).then((results) => {
            this.emotes = [...results[0], ...results[1]];
            this.prepare7tvWebSocket();
        });
    }

    public getEmotes(): Emote[] {
        return this.emotes;
    }

    private addEmoteToCache(emote: Emote): void {
        this.emotes.push(emote);
    }

    private removeEmoteFromCache(emoteId: string): void {
        this.emotes = this.emotes.filter(emote => emote.id !== emoteId);
    }

    private async fetch7tvChannelEmotes(channelId: string): Promise<Emote[]> {
        const response = await fetch(`${this.base7tvUrl}/users/twitch/${channelId}`);
        if (!response.ok) {
            console.error(`Failed to fetch 7TV emotes for channel ID ${channelId}: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        this.emoteSetId = data.emote_set.id;
        return data.emote_set.emotes.map((emote: {id: string, name: string}) => ({
            id: emote.id,
            name: emote.name,
            source: '7TV'
        }));
    }

    private async fetch7tvGlobalEmotes(): Promise<Emote[]> {
        const response = await fetch(`${this.base7tvUrl}/emote-sets/global`);
        if (!response.ok) {
            console.error(`Failed to fetch global 7TV emotes: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        return data.emotes.map((emote: {id: string, name: string}) => ({
            id: emote.id,
            name: emote.name,
            source: '7TV'
        }));
    }

    private prepare7tvWebSocket(): void {
        this.seventvWs = SevenTVWebSocket.getInstance();
        this.seventvWs.setEmoteSetId(this.emoteSetId);
        this.seventvWs.on('emoteAdded', (emote: Emote) => {
            this.addEmoteToCache(emote);
        });
        this.seventvWs.on('emoteRemoved', (emoteId: string) => {
            this.removeEmoteFromCache(emoteId);
        });
        this.seventvWs.on('connected', () => {
            console.log('Connected to 7TV WebSocket');
        });
        this.seventvWs.on('closed', () => {
            console.log('7TV WebSocket connection closed.');
        });
        this.seventvWs.on('error', (error: unknown) => {
            console.error('7TV WebSocket error:', error);
        });
        console.log('7TV WebSocket listener ready to connect.');
    }

}

