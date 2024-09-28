import { setupAuth } from "./auth/twitch.js";
import { createMessageHtml, createBadges, getPronouns, getRedemption } from "./handlers/message.js";
import { getBadgeCache, getEmoteCache, getPronounCache } from "./handlers/caches.js";
import { getUserColor } from "./functions/utils.js";
import { server, emit } from "./handlers/server.js";
import { enqueue, dequeue, size } from "./handlers/queue.js";

import * as dotenv from 'dotenv';
dotenv.config();

server();

const authResult = await setupAuth();

if (authResult === false) {
    console.error('Authentication setup failed.');
    process.exit(1); // Exit the process with an error code
}

const { client, chat } = authResult;

try {

    await getBadgeCache(client);
    await getEmoteCache();
    await getPronounCache();

    chat.onMessage(async (channel, user, message, msg) => {

        const { emoteOffsets, userInfo, id, isCheer } = msg;

        console.log(`Added: ${id} - ${userInfo.displayName} - ${message}`);

        const messageHtml = createMessageHtml(message, emoteOffsets, isCheer);

        const badgeHtml = await createBadges(userInfo);

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
        if (!userId) return;
        console.log(`Removed user: ${userId.id}`);

        queueMessage('removeUserMessages', { id: userId.id });
        // emit('removeUserMessages', { userId: userId.id });
    });

    chat.onBan(async (channel, user, msg) => {
        const userId = await client.users.getUserByName(user);
        if (!userId) return;
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


    function queueMessage(target: string, message: any) {
        enqueue(target, message);
        processQueue();
    }

    const processQueue = () => {
        while (size() > 0) {
            const item = dequeue();
            if (!item) return;
            console.log(`Emitting: ${item.target} - ${JSON.stringify(item)}`);
            emit(item.target, item.message);
        }
    }
} catch (error) {
    console.error(error);
}