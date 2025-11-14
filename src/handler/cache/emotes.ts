import ws from 'ws';
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

    private constructor() {
        this.initialize();
    }

    public static getInstance(): EmoteCache {
        if (!EmoteCache.instance) {
            EmoteCache.instance = new EmoteCache();
        }
        return EmoteCache.instance;
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
            this.create7tvWebsocket();
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

    private async create7tvWebsocket(): Promise<void> {
        if (!this.base7tvWsUrl) return console.error('7TV WebSocket endpoint is not defined in environment variables.');
        const socket = new ws(this.base7tvWsUrl);


        const payload = {
            "op": 35,
            "d": {
                "type": "emote_set.update",
                "condition": {
                    "object_id": this.emoteSetId,
                }
            }
        }

        await new Promise((resolve) => {
            socket.on("open", () => {
                console.log(`Connected to 7TV Websocket`);
                socket.send(JSON.stringify(payload))
                resolve(true);
            });
        });

        socket.on("message", (data) => {
            //data from buffer to object
            const msg = JSON.parse(data.toString());

            //if msg.op is 0 and msg.d.type is emote_set.update
            if (msg.op === 0 && msg.d.type === "emote_set.update") {
                const body = msg.d.body;

                console.log('Recieved 7TV Emote Update')

                //if body.pushed exists
                if (body.pushed) {
                    //for each emote in body.pushed
                    body.pushed.forEach((data: {value: {id: string, name: string}}) => {
                        const emote = {
                            id: data.value.id,
                            name: data.value.name,
                            source: '7TV'
                        }

                        this.addEmoteToCache(emote);
                    });
                }

                //if body.pulled exists
                if (body.pulled) {
                    //for each emote in body.pulled
                    body.pulled.forEach((data: {old_value: {id: string}}) => {
                        if (!data.old_value) return;
                        this.removeEmoteFromCache(data.old_value.id);
                    });
                }
            }
        });

    }
}

