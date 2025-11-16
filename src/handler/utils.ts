import { createHash } from "crypto";
import { PronounCache } from "./cache/pronouns.js";
import { TwitchProvider } from "../api/twitch.js";
import { EmoteCache } from "./cache/emotes.js";
import { BadgeCache } from "./cache/badges.js";

// --- Utility Functions ---

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHTML(str: string): string {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return map[m] || m;
    });
}

// --- Main Functions ---

export function getUserColor(displayName: string): string {
    return `#${createHash('md5').update(displayName).digest('hex').slice(26)}`;
}

export async function getPronouns(displayName: string): Promise<string | undefined> {
    try {
        const response = await fetch(`https://pronouns.alejo.io/api/users/${displayName}`);
        const data = await response.json();
        if (!data.length) return;
        const pronounCache = PronounCache.getInstance().getPronouns();
        const pronoun = pronounCache.find(p => p.name === data[0].pronoun_id);
        return pronoun?.display;
    } catch (err) {
        console.error(err);
        return;
    }
}

export async function getRedemption(
    broadcasterId: string | null,
    rewardId: string | null
): Promise<{ title: string; cost: number } | null> {
    if (!broadcasterId || !rewardId) return null;
    const client = await TwitchProvider.getInstance();
    const reward = await client.channelPoints.getRewardById(broadcasterId, rewardId);
    if (!reward.data.length) return null;
    return {
        title: reward.data[0].title,
        cost: reward.data[0].cost
    };
}

export async function getSharedChat(
    broadcasterId: string | null
): Promise<false | {
    fromChannelProfileImageUrl: string;
    fromChannelDisplayName: string;
    isSourceBroadcaster: boolean;
}> {
    if (!broadcasterId) return false;
    const client = await TwitchProvider.getInstance();
    const broadcaster = await client.users.getUserById(broadcasterId);
    if (!broadcaster.data.length) return false;
    return {
        fromChannelProfileImageUrl: broadcaster.data[0].profile_image_url,
        fromChannelDisplayName: broadcaster.data[0].display_name,
        isSourceBroadcaster: broadcasterId === client.me?.id
    };
}

export async function parseMessageParts(messageParts: TwitchChannelChatMessageFragment[]): Promise<string> {
    const emoteCacheInstance = await EmoteCache.getInstance();
    const emoteCache = emoteCacheInstance.getEmotes();
    const emoteMap = new Map<string, string>();
    const emoteNames: string[] = [];

    for (const emote of emoteCache) {
        emoteMap.set(emote.name, `https://cdn.7tv.app/emote/${emote.id}/3x.webp`);
        emoteNames.push(escapeRegExp(emote.name));
    }

    const emoteRegex = emoteNames.length
        ? new RegExp(`\\b(${emoteNames.join('|')})\\b`, 'g')
        : null;

    return messageParts.map((part) => {
        switch (part.type) {
            case "emote": {
                return `<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${part.emote.id}/default/dark/3.0" alt="${escapeHTML(part.text)}" />`;
            }
            case "cheermote": {
                return `<span class="cheer cheer-${part.cheermote.prefix}"><img src="https://d3aqoihi2n8ty8.cloudfront.net/actions/${part.cheermote.prefix}/dark/animated/${part.cheermote.tier}/4.gif" alt="Cheer"/> ${part.cheermote.bits}</span>`;
            }
            case "mention": {
                return escapeHTML(part.mention.user_name);
            }
            case "text": {
                if (!emoteRegex) return escapeHTML(part.text);
                const segments = part.text.split(emoteRegex);
                return segments.map(segment =>
                    emoteMap.has(segment)
                        ? `<img class="emote" src="${emoteMap.get(segment)}" alt="${escapeHTML(segment)}" />`
                        : escapeHTML(segment)
                ).join('');
            }
            default: {
                return '';
            }
        }
    }).join('');
}

export function parseBadges(
    badges: { set_id: string; id: string; info: string; }[] | null
): { title: string; url: string; }[] {
    if (!badges || badges.length === 0) return [];
    const badgeCache = BadgeCache.getInstance();
    return badges
        .map(badge => {
            const badgeVersion = badgeCache.getBadgeFromCache(badge.set_id, badge.id);
            if (!badgeVersion) return null;
            return {
                title: `${badge.set_id} ${badge.id}`,
                url: badgeVersion.image_url
            };
        })
        .filter(Boolean) as { title: string; url: string; }[];
}