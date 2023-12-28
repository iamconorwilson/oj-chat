import { setupAuth } from "./auth/twitch.js";
import { createMessageHtml, createBadges, getPronouns, getRedemption } from "./functions/message.js";
import { getBadgeCache, getEmoteCache, getPronounCache } from "./functions/caches.js";
import { getUserColor } from "./functions/utils.js";
import { server, emit } from "./functions/server.js";


import * as dotenv from 'dotenv';
dotenv.config();

server();

const { client, chat } = await setupAuth();

await getBadgeCache(client);
await getEmoteCache(process.env.TWITCH_USER_ID);
await getPronounCache();

chat.onMessage(async (channel, user, message, msg) => {
    
    const { emoteOffsets, userInfo, id, isCheer } = msg;

    const messageHtml = createMessageHtml(message, emoteOffsets, isCheer);

    const badgeHtml = await createBadges(userInfo, client);

    console.log('Is redemption? ' + msg.isRedemption);

    const redemption = msg.isRedemption ? await getRedemption(msg.rewardId, client) : null;


    const msgDetail = {
        id: id,
        message: messageHtml,
        user: {
            displayName: userInfo.displayName,
            userId: userInfo.userId
        },
        badges:badgeHtml,
        color: userInfo.color !== '' ? userInfo.color : getUserColor(userInfo.displayName),
        pronouns: await getPronouns(userInfo),
        redemption: redemption
    }

    console.log(msgDetail);

    emit('newMessage', msgDetail);

});

chat.onMessageRemove((channel, messageId, msg) => {
    console.log(messageId);
    emit('removeSingleMessage', { id: messageId });
});

chat.onTimeout(async (channel, user, duration, msg) => {
    const userId = await client.users.getUserByName(user);
    emit('removeUserMessages', { userId: userId.id });
});

chat.onBan(async (channel, user, msg) => {
    const userId = await client.users.getUserByName(user);
    emit('removeUserMessages', { userId: userId.id });
});

chat.onChatClear((channel, msg) => {
    emit('removeAllMessages');
});

chat.onAuthenticationSuccess(() => {
    console.log("Connected to chat");
});

chat.connect();

