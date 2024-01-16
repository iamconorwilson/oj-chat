import axios from "axios";

const baseUrl = "https://7tv.io/v3/";
const emoteSets = [];

const getChannelEmotes = async (userId) => {
    const endpoint = baseUrl + `users/twitch/${userId}`;

    const filter = (response) => {
        emoteSets.push(response.data.emote_set.id);
        const emotes = response.data.emote_set.emotes.map((emote) => {
            return {
                id: emote.data.id,
                name: emote.data.name,
                isZeroWidth: Boolean(emote.flags)
            }
        });
        return emotes;
    }

    return await requestEmotes(endpoint, filter);
}

const getGlobalEmotes = async () => {
    const endpoint = baseUrl + `emote-sets/global`;

    const filter = (response) => {
        const emotes = response.data.emotes.map((emote) => {
            return {
                id: emote.data.id,
                name: emote.data.name,
                isZeroWidth: Boolean(emote.flags)
            }
        });
        return emotes;
    }

    return await requestEmotes(endpoint, filter);
}


const requestEmotes = async (url, func) => {
    return axios.get(url)
    .then((response) => {
        return func(response);
    })
    .catch((err) => {
        console.error(err);
    });
}

const getEmotes = async (userId) => {
    const channelEmotes = await getChannelEmotes(userId);
    const globalEmotes = await getGlobalEmotes();

    return [...channelEmotes, ...globalEmotes];
}

export { getEmotes, emoteSets}