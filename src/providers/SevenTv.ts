import axios from "axios";

const baseUrl = "https://7tv.io/v3/";
const emoteSets: string[] = [];

type EmoteFilterFunction = (response: any) => Emote[];


const getChannelEmotes = async (userId: string): Promise<Emote[]> => {
    const endpoint = baseUrl + `users/twitch/${userId}`;

    const filter: EmoteFilterFunction = (response: SevenTvChannelEmoteSet) => {
        emoteSets.push(response.data.emote_set.id);
        const emotes = response.data.emote_set.emotes.map((emote: SevenTvEmote) => {
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

const getGlobalEmotes = async (): Promise<Emote[]> => {
    const endpoint = baseUrl + `emote-sets/global`;

    const filter: EmoteFilterFunction = (response: SevenTvGlobalEmoteSet) => {
        const emotes = response.data.emotes.map((emote: SevenTvEmote) => {
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


const requestEmotes = async (url: string, func: EmoteFilterFunction): Promise<Emote[]> => {
    return axios.get(url)
        .then((response) => {
            return func(response);
        })
        .catch((err) => {
            console.error(err);
            return [];
        });
}

const getEmotes = async (userId: string) => {
    const channelEmotes = await getChannelEmotes(userId);
    const globalEmotes = await getGlobalEmotes();

    return [...channelEmotes, ...globalEmotes];
}

export { getEmotes, emoteSets }