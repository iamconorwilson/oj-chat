import { badgeCache, pronounCache, emoteCache } from './caches.js';

import * as dotenv from 'dotenv';
dotenv.config();


export const createMessageHtml = (message, twitchEmotes, isCheer) => {
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
        //emote name should not be within another word
        const emoteName = emote.name;
        const emoteRegex = new RegExp(`\\b${emoteName}\\b`);
        const match = message.match(emoteRegex);

        if (match) {
            const emoteStart = match.index
            const emoteEnd = emoteStart + emoteName.length - 1;
            
            const emoteUrl = `https://cdn.7tv.app/emote/${emote.id}/3x.webp`;
            replacements.push({
                start: emoteStart,
                end: emoteEnd,
                text: `<img class="emote" src="${emoteUrl}" alt="${emoteName}" />`
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
    for (let {start, end, text} of replacements) {
        message = message.slice(0, start) + text + message.slice(end + 1);
    }

    

    return message;
}

export const createBadges = async (userInfo) => {

    const { badges } = userInfo;

    const badgeImg = [];

    for (const [ setName, version ] of badges.entries()) {
        
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

export const getPronouns = async (userInfo) => {
    const { displayName } = userInfo;
    return await fetch(`https://pronouns.alejo.io/api/users/${displayName}`)
    .then((response) => response.json())
    .then((data) => {
        if (data.length === 0) return;

        const pronoun = pronounCache.find(p => p.name === data[0].pronoun_id);
        return pronoun.display;
    })
}

export const getRedemption = async (rewardId, client) => {
    const redemption = await client.channelPoints.getCustomRewardById(process.env.TWITCH_USER_ID, rewardId);

    return {
        title: redemption.title,
        cost: redemption.cost
    }
}

