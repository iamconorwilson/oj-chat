import axios from "axios";
import { emoteUpdates } from "./websocket.js";

export const badgeCache = [];
export const pronounCache = [];
export const emoteCache = [];

let emoteSetId = '';

export const getPronounCache = () => {
    return axios.get("https://pronouns.alejo.io/api/pronouns")
    .then((response) => pronounCache.push(...response.data))
    .catch((err) => console.error(err));
}

export const getEmoteCache = async () => {
    await getChannelEmotes(process.env.TWITCH_USER_ID);
    await getGlobalEmotes();

    emoteUpdates(emoteSetId);

    return Promise.resolve();
}

export const getBadgeCache = async (client) => {
    const channelBadges = await client.chat.getChannelBadges(process.env.TWITCH_USER_ID);
    const globalBadges = await client.chat.getGlobalBadges();

    badgeCache.push(...channelBadges,...globalBadges);

    return Promise.resolve();
}

export const addEmoteToCache = (emote) => {
    //if emote exists in cache, do nothing
    if (emoteCache.findIndex((cacheEmote) => cacheEmote.id === emote.id) !== -1) return;
    console.log(`Adding ${emote.name} to cache`);

    emoteCache.push(emote);
}

export const removeEmoteFromCache = (emoteId) => {
    const index = emoteCache.findIndex((emote) => emote.id === emoteId);
    //if emote does not exist in cache, do nothing
    if (index === -1) return;

    console.log(`Removing ${emoteCache[index].name} from cache`);

    emoteCache.splice(index, 1);
}

const getChannelEmotes = (twitchId) => {
    return axios.get(`https://7tv.io/v3/users/twitch/${twitchId}`)
    .then((response) => {
        emoteSetId = response.data.emote_set.id;
        const emotes = response.data.emote_set.emotes.map((emote) => {
            return {
                id: emote.data.id,
                name: emote.data.name,
                isZeroWidth: Boolean(emote.flags)
            }
        });
        emoteCache.push(...emotes);
    })
    .catch((err) => {
        console.error(err);
    });
}

const getGlobalEmotes = () => {
    return axios.get(`https://7tv.io/v3/emote-sets/global`)
    .then((response) => {
        const emotes = response.data.emotes.map((emote) => {
            return {
                id: emote.data.id,
                name: emote.data.name,
                isZeroWidth: Boolean(emote.flags)
            }
        });
        emoteCache.push(...emotes);
    })
    .catch((err) => {
        console.error(err);
    });
}

