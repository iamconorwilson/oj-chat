import axios from "axios";


export const badgeCache = [];
export const pronounCache = [];
export const emoteCache = [];

export const getPronounCache = () => {
    return axios.get("https://pronouns.alejo.io/api/pronouns")
    .then((response) => pronounCache.push(...response.data))
    .catch((err) => console.error(err));
}

export const getEmoteCache = (twitchId) => {
    return axios.get(`https://7tv.io/v3/users/twitch/${twitchId}`)
    .then((response) => {
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

export const getGlobalEmoteCache = () => {
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

export const getBadgeCache = async (client) => {
    const channelBadges = await client.chat.getChannelBadges(process.env.TWITCH_USER_ID);
    const globalBadges = await client.chat.getGlobalBadges();

    badgeCache.push(...channelBadges,...globalBadges);

    return Promise.resolve();
}
