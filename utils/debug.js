import axios from 'axios';

const get7tvEmotes = (twitchId) => {
    axios.get(`https://7tv.io/v3/users/twitch/${twitchId}`).then((response) => {
        //get channel emote ids and names from response.data.emote_set.emotes
        const emotes = response.data.emote_set.emotes.map((emote) => {
            return {
                id: emote.data.id,
                name: emote.data.name
            }
        });

        console.log(emotes);
    }
    ).catch((err) => {
        console.log(err);
    });
}

get7tvEmotes(36401576);