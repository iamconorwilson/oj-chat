import axios from "axios";
import { emoteUpdates } from "./websocket.js";
import { ApiClient, HelixChatBadgeSet } from "@twurple/api";
import { client } from "../auth/twitch.js";

export const badgeCache: HelixChatBadgeSet[] = [];
export const pronounCache: Pronoun[] = [];
export const emoteCache: Emote[] = [];

let emoteSetId: string = '';

const getPronounCache = () => {
    return axios.get("https://pronouns.alejo.io/api/pronouns")
    .then((response) => pronounCache.push(...response.data))
    .catch((err) => console.error(err));
}

const getEmoteCache = async () => {
    await getChannelEmotes(process.env.TWITCH_USER_ID);
    await getGlobalEmotes();

    emoteUpdates(emoteSetId);

    return Promise.resolve();
}

const getBadgeCache = async () => {
    if (!client) throw new Error('Twitch client not initialized');

    const channelBadges = await client.chat.getChannelBadges(process.env.TWITCH_USER_ID);
    const globalBadges = await client.chat.getGlobalBadges();

    badgeCache.push(...channelBadges,...globalBadges);

    return Promise.resolve();
}

export const addEmoteToCache = (emote: Emote) => {
    //if emote exists in cache, do nothing
    if (emoteCache.findIndex((cacheEmote: Emote) => cacheEmote.id === emote.id) !== -1) return;
    console.log(`Adding ${emote.name} to cache`);

    emoteCache.push(emote);
}

export const removeEmoteFromCache = (emoteId: Emote["id"]) => {
    const index = emoteCache.findIndex((emote) => emote.id === emoteId);
    //if emote does not exist in cache, do nothing
    if (index === -1) return;

    console.log(`Removing ${emoteCache[index].name} from cache`);

    emoteCache.splice(index, 1);
}

const getChannelEmotes = (twitchId: string) => {
    return axios.get(`https://7tv.io/v3/users/twitch/${twitchId}`)
    .then((response) => {
        emoteSetId = response.data.emote_set.id;
        const emotes = response.data.emote_set.emotes.map((emote: SevenTvEmote) => {
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
        const emotes = response.data.emotes.map((emote: SevenTvEmote) => {
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

export const getCaches = async (): Promise<void> => {
    await Promise.all([
        getBadgeCache(),
        getEmoteCache(),
        getPronounCache()
    ]); 
}