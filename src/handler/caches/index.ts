import { BadgeCache } from "./badges.js";
import { EmoteCache } from "./emotes.js";
import { PronounCache } from "./pronouns.js";

export const createCaches = async () => {
  await Promise.all([
    BadgeCache.getInstance(),
    EmoteCache.getInstance(),
    PronounCache.getInstance()
  ]);
}