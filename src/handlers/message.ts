import { ChatMessage, ChatUser } from '@twurple/chat';
import { badgeCache, pronounCache, emoteCache } from './caches.js';
import { getUserColor } from "../functions/utils.js";
import { enqueue, processQueue } from './queue.js';
import { client } from '../auth/twitch.js';

import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });


// HANDLERS
export const handleNewMessage = async (message: string, msg: ChatMessage) => {

    const { emoteOffsets, userInfo, id, isCheer } = msg;

    console.log(`Added: ${id} - ${userInfo.displayName} - ${message}`);

    const messageHtml = createMessageHtml(message, emoteOffsets, isCheer);

    const badgeHtml = await createBadges(userInfo);

    const redemption = msg.isRedemption ? await getRedemption(msg.rewardId) : null;

    const highlight = msg.isHighlight;


    const msgDetail = {
        id: id,
        message: messageHtml,
        user: {
            displayName: userInfo.displayName,
            userId: userInfo.userId
        },
        badges: badgeHtml,
        color: userInfo.color !== '' ? userInfo.color : getUserColor(userInfo.displayName),
        pronouns: await getPronouns(userInfo),
        redemption: redemption,
        highlight: highlight
    }

    console.log(`Queued: ${id} - ${userInfo.displayName} - ${message}`);

    enqueue('newMessage', msgDetail);
    processQueue();
};

export const handleMessageRemove = (messageId: string) => {
    console.log(`Removed: ${messageId}`);
    enqueue('removeSingleMessage', { id: messageId });
    processQueue();
};

export const removeUserMessages = async (user: string) => {
    if (!client) throw new Error('Twitch client not initialized');

    const userId = await client.users.getUserByName(user)
    if (!userId) return;
    console.log(`Removed user: ${userId.id}`);

    enqueue('removeUserMessages', { id: userId.id });
    processQueue();
};

export const clearAllMessages = () => {
    console.log('Cleared chat');
    enqueue('removeAllMessages', {});
    processQueue();
};

// HELPERS
const createMessageHtml = (message: string, twitchEmotes: Map<string, string[]>, isCheer: boolean) => {
    let replacements = [];

    // Handle cheers
    if (isCheer) {
        const cheerRegex = /\bCheer[0-9]+\b/g;
        const cheerAmounts = ['10000', '5000', '1000', '100', '1'];
        let cheerMatch;

        while ((cheerMatch = cheerRegex.exec(message)) !== null) {
            const cheerAmount = parseInt(cheerMatch[0].slice(5));
            const closestAmount = cheerAmounts.find(amount => cheerAmount >= parseInt(amount));
            const cheerUrl = `https://static-cdn.jtvnw.net/bits/dark/animated/${closestAmount}/3.gif`;
            const cheerName = cheerMatch[0];
            const cheerStart = cheerMatch.index;
            const cheerEnd = cheerStart + cheerName.length - 1;

            if (cheerStart !== -1) {
                replacements.push({
                    start: cheerStart,
                    end: cheerEnd,
                    text: `<span class="cheer cheer-${closestAmount}"><img src="${cheerUrl}" alt="Cheer"/> ${cheerAmount}</span>`
                });
            }
        }
    }


    // Handle Twitch emotes
    for (let [key, value] of twitchEmotes.entries()) {

        //loop through values
        for (let emote of value) {
            const emoteStart = parseInt(emote.split("-")[0]);
            const emoteEnd = parseInt(emote.split("-")[1]);
            const emoteName = message.slice(emoteStart, emoteEnd + 1);
            const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${key}/default/dark/3.0`;

            replacements.push({
                start: emoteStart,
                end: emoteEnd,
                text: `<img class="emote" src="${emoteUrl}" alt="${emoteName}" />`
            });
        }
    }

    // Handle 7tv emotes
    for (let emote of emoteCache) {
        ////emote name should not be within another word
        const hasBrackets = emote.name.includes('(') || emote.name.includes(')');
        const emoteName = emote.name.replace(/\(|\)/g, '');
        const emoteNameEsc = emoteName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const emoteRegex = new RegExp(`\\b${emoteNameEsc}\\b`, `g`);
        const matches = [...message.matchAll(emoteRegex)];

        //if no matches, continue
        if (matches.length === 0) continue;

        for (const match of matches) {

            let startOffset = 0;
            let endOffset = 0;

            //if has brackets and previous char is an opening bracket, remove 1 from start index
            if (hasBrackets && message[match.index - 1] === '(') {
                startOffset = -1;
                endOffset = 2;
            }

            const emoteStart = match.index + startOffset;
            const emoteEnd = emoteStart + emoteName.length + endOffset - 1;
            const zeroWidth = emote.isZeroWidth ? 'zero-width' : '';

            const emoteUrl = `https://cdn.7tv.app/emote/${emote.id}/3x.webp`;
            replacements.push({
                start: emoteStart,
                end: emoteEnd,
                text: `<img class="emote ${zeroWidth}" src="${emoteUrl}" alt="${emoteName}" />`,
                isZeroWidth: emote.isZeroWidth
            });
        }
    }

    //look through replacements and remove any that overlap
    for (let i = 0; i < replacements.length; i++) {
        for (let j = i + 1; j < replacements.length; j++) {
            if (replacements[i].start <= replacements[j].end && replacements[i].end >= replacements[j].start) {
                replacements.splice(j, 1);
            }
        }
    }


    // Sort replacements in descending order by start index
    replacements.sort((a, b) => b.start - a.start);

    // Apply replacements
    for (let emote of replacements) {

        const { start, end, text, isZeroWidth } = emote;

        let index = replacements.findIndex(r => r.start === start && r.end === end);

        //if previous emote is zero width, skip
        if (replacements[index - 1]?.isZeroWidth) {
            message = message.slice(0, start) + message.slice(end + 1);
            continue;
        }

        let replaceText = '';

        //if emote is zero width
        if (isZeroWidth) {
            const nextEmote = replacements[index + 1];
            replaceText = `<span class="zero-width-wrap">${nextEmote.text}${text}</span>`;
        } else {
            replaceText = text;
        }

        message = message.slice(0, start) + replaceText + message.slice(end + 1);
    }



    return message;
}

const createBadges = async (userInfo: ChatUser) => {

    const { badges } = userInfo;

    const badgeImg = [];

    for (const [setName, version] of badges.entries()) {

        const set = badgeCache.find(set => set.id === setName);
        if (!set) continue;

        const setVerson = set.getVersion(version);
        if (!setVerson) continue;

        badgeImg.push({
            title: set.id,
            imageUrl: setVerson.getImageUrl(2)
        });
    }

    return badgeImg;
}

const getPronouns = async (userInfo: ChatUser) => {
    const { displayName } = userInfo;
    return await fetch(`https://pronouns.alejo.io/api/users/${displayName}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.length === 0) return;

            const pronoun = pronounCache.find(p => p.name === data[0].pronoun_id);
            if (!pronoun) return;
            return pronoun.display;
        })
        .catch((err) => {
            console.error(err);
            return;
        });
}

const getRedemption = async (rewardId: string | null) => {
    if (!client) throw new Error('Twitch client not initialized');
    if (!rewardId) return;
    const redemption = await client.channelPoints.getCustomRewardById(process.env.TWITCH_USER_ID, rewardId);
    if (!redemption) return;
    return {
        title: redemption.title,
        cost: redemption.cost
    };
}