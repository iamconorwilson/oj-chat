import { io } from 'socket.io-client';
import type { EmittedChatClearUserMessages, EmittedChatDelete, EmittedChatMessage, EmittedChatNotification, EmittedChatShared } from '../types/emittedMessages.js';
import { onRemoveUserMsg, onRemoveSingleMsg, onRemoveAllMsg, onSharedChatMsg, onMessageEvent, onNotificationEvent } from './dom.js';

type QueuedMessageData = EmittedChatMessage | EmittedChatNotification;

const eventQueue: QueuedMessageData[] = [];
let queueProcessing = false;

const processEventQueue = () => {
    if (queueProcessing || eventQueue.length === 0) return;
    queueProcessing = true;
    scheduleFrame(async () => {
        let batchSize = 1;
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
            batchSize = 20;
        } else if (eventQueue.length > 5) {
            batchSize = eventQueue.length;
        }

        for (let i = 0; i < batchSize && eventQueue.length > 0; i++) {
            const nextEvent = eventQueue.shift();
            try {
                if (nextEvent) {
                    if (nextEvent.type === 'chatMessage') {
                        await onMessageEvent(nextEvent.data);
                    } else if (nextEvent.type === 'chatNotification') {
                        await onNotificationEvent(nextEvent.data);
                    } else {
                        console.error('Unknown event type:', nextEvent);
                    }
                }
            } catch (err) {
                console.error('Error processing queued event:', err);
            }
        }

        queueProcessing = false;
        if (eventQueue.length > 0) processEventQueue();
    });
};

const scheduleFrame = (cb: () => void) => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        requestAnimationFrame(cb);
    } else {
        setTimeout(cb, 50);
    }
};

export const wsConnect = () => {
    const socketUrl = !window.IS_PRODUCTION ? 'http://127.0.0.1:3000' : undefined;
    const socket = io(socketUrl);

    socket.on('connect', () => {
        console.log("Connected");
    });

    window.onerror = (message, source, lineno, colno, error) => {
        console.error(error);
        if (socket && socket.connected) {
            socket.emit('clientError', { message, source, lineno, colno, error: error?.toString() });
        }
        return false;
    };

    socket.on('version', (data: string) => console.log(`Server version: ${data}`));

    socket.on('chatMessage', (data: EmittedChatMessage['data']) => {
        eventQueue.push({ type: 'chatMessage', data });
        processEventQueue();
    });

    socket.on('chatNotification', (data: EmittedChatNotification['data']) => {
        eventQueue.push({ type: 'chatNotification', data });
        processEventQueue();
    });

    socket.on('chatClearUserMessages', (data: EmittedChatClearUserMessages['data']) => onRemoveUserMsg(data));
    socket.on('chatMessageDelete', (data: EmittedChatDelete['data']) => onRemoveSingleMsg(data));
    socket.on('chatClear', () => onRemoveAllMsg());
    socket.on('chatSharedChat', (data: EmittedChatShared['data']) => onSharedChatMsg(data));

    socket.on('disconnect', () => {
        console.log("Disconnected");
    });
};
