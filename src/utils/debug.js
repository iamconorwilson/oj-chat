
import ws from 'ws';

const connect = new ws("wss://events.7tv.io/v3");

connect.on("open", () => {
    console.log("Connected to 7TV");
    connect.send(JSON.stringify({
        "op": 35,
        "d": {
            "type": "emote_set.update",
            "condition": {
                "object_id": "63b4934d4fa40583f9b59249",
            }
        }
    }))
});



connect.on("message", (data) => {
    //data from buffer to object
    const msg = JSON.parse(data.toString());

    //if msg.op is 0 and msg.d.type is emote_set.update
    if (msg.op === 0 && msg.d.type === "emote_set.update") {
        //log msg
        console.log('Emote Update');
    }
});