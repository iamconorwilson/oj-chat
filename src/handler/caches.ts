import { BadgeCache } from "./cache/badges.js";
import { EmoteCache } from "./cache/emotes.js";
import { PronounCache } from "./cache/pronouns.js";

export const createCaches = async () => {
    await Promise.all([
        BadgeCache.getInstance(),
        EmoteCache.getInstance(),
        PronounCache.getInstance()
    ]);
}