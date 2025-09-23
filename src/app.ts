import { setupAuth } from "./auth/twitch.js";
import { handleNewMessage, handleMessageRemove, removeUserMessages, clearAllMessages } from "./handlers/message.js";
import { getCaches } from "./handlers/caches.js";
import { server } from "./handlers/server.js";

import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

server();

const authResult = await setupAuth();

if (authResult === false) {
    console.error('Authentication setup failed.');
    process.exit(1); // Exit the process with an error code
}

const { listener } = authResult;

const targetUserId = process.env.TWITCH_USER_ID;

try {

    // LOAD CACHES (Emotes, Badges, Pronouns)
    await getCaches();

    listener.onChannelChatMessage(targetUserId, targetUserId, async (message) => {
        await handleNewMessage(message.messageText, message);
    });

    // EVENT LISTENERS
    chat.onMessage(async (channel, user, message, msg) => {
        await handleNewMessage(message, msg);
    });

    chat.onMessageRemove((channel, messageId, msg) => {
        handleMessageRemove(messageId);
    });

    chat.onTimeout(async (channel, user, duration, msg) => {
        await removeUserMessages(user);
    });

    chat.onBan(async (channel, user, msg) => {
        await removeUserMessages(user);
    });

    chat.onChatClear((channel, msg) => {
        clearAllMessages();
    });

    chat.onAuthenticationSuccess(() => {
        console.log("Connected to chat");
    });

    chat.connect();

} catch (error) {
    console.error(error);
}