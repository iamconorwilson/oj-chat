import { setupAuth } from "./auth/twitch.js";
import { createMessageHtml, createBadges, getPronouns, getRedemption } from "./functions/message.js";
import { getBadgeCache, getEmoteCache, getPronounCache } from "./functions/caches.js";
import { getUserColor } from "./functions/utils.js";
import { server, emit } from "./functions/server.js";
import { enqueue, dequeue, size } from "./functions/queue.js";


import * as dotenv from 'dotenv';
dotenv.config();

server();

const { client, chat } = await setupAuth();

try {

    await getBadgeCache(client);
    await getEmoteCache();
    await getPronounCache();

    chat.onMessage(async (channel, user, message, msg) => {

        const { emoteOffsets, userInfo, id, isCheer } = msg;

        console.log(`Added: ${id} - ${userInfo.displayName} - ${message}`);

        const messageHtml = createMessageHtml(message, emoteOffsets, isCheer);

        const badgeHtml = await createBadges(userInfo, client);

        const redemption = msg.isRedemption ? await getRedemption(msg.rewardId, client) : null;

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

        queueMessage('newMessage', msgDetail);

    });

    chat.onMessageRemove((channel, messageId, msg) => {
        console.log(`Removed: ${messageId}`);
        queueMessage('removeSingleMessage', { id: messageId });
        // emit('removeSingleMessage', { id: messageId });
    });

    chat.onTimeout(async (channel, user, duration, msg) => {
        const userId = await client.users.getUserByName(user)
        console.log(`Removed user: ${userId.id}`);

        queueMessage('removeUserMessages', { id: userId.id });
        // emit('removeUserMessages', { userId: userId.id });
    });

    chat.onBan(async (channel, user, msg) => {
        const userId = await client.users.getUserByName(user);
        console.log(`Banned user: ${userId.id}`);

        queueMessage('removeUserMessages', { id: userId.id });
        // emit('removeUserMessages', { userId: userId.id });
    });

    chat.onChatClear((channel, msg) => {
        console.log('Cleared chat');
        queueMessage('removeAllMessages', {});
        // emit('removeAllMessages');
    });

    chat.onAuthenticationSuccess(() => {
        console.log("Connected to chat");
    });

    chat.connect();


    const queueMessage = (target, message) => {
        enqueue(target, message);
        processQueue();
    }

    const processQueue = () => {
        while (size() > 0) {
            const item = dequeue();
            console.log(`Emitting: ${item.target} - ${JSON.stringify(item)}`);
            emit(item.target, item.message);
        }
    }
} catch (error) {
    console.error(error);
}