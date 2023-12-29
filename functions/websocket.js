import ws from 'ws';
import { addEmoteToCache, removeEmoteFromCache } from './caches.js';

export const emoteUpdates = (emoteSetId) => {
    const socket = new ws("wss://events.7tv.io/v3");

    const payload = {
        "op": 35,
        "d": {
            "type": "emote_set.update",
            "condition": {
                "object_id": emoteSetId,
            }
        }
    }

    socket.on("open", () => {
        console.log("Connected to 7TV");
        socket.send(JSON.stringify(payload))
    });

    socket.on("message", (data) => {
        //data from buffer to object
        const msg = JSON.parse(data.toString());

        //if msg.op is 0 and msg.d.type is emote_set.update
        if (msg.op === 0 && msg.d.type === "emote_set.update") {
            const body = msg.d.body;

            console.log('Emote Update Received')

            //if body.pushed exists
            if (body.pushed) {
                //for each emote in body.pushed
                body.pushed.forEach((data) => {
                    const emote = {
                        id: data.value.id,
                        name: data.value.name,
                        isZeroWidth: Boolean(data.value.flags)
                    }

                    addEmoteToCache(emote);
                });
            }

            //if body.pulled exists
            if (body.pulled) {
                //for each emote in body.pulled
                body.pulled.forEach((data) => {
                    removeEmoteFromCache(data.old_value.id);
                });
            }
        }
    });

}