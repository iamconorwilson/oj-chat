import { io } from 'socket.io-client';
import { ChatMessageData, ChatClearUserMessagesData, ChatMessageDeleteData, SharedChatData } from './types';
import { onMsgEvent, onRemoveUserMsg, onRemoveSingleMsg, onRemoveAllMsg, onSharedChatMsg } from './dom';

let eventQueue: ChatMessageData[] = [];
let queueProcessing = false;

const processEventQueue = () => {
    if (queueProcessing || eventQueue.length === 0) return;
    queueProcessing = true;
    scheduleFrame(async () => {
        // Process multiple items when hidden, or when the queue has backed up, to catch up quickly
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
                    await onMsgEvent(nextEvent);
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
    const socket = io();

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
    
    socket.on('chatMessage', (data: ChatMessageData) => {
        eventQueue.push(data);
        processEventQueue();
    });
    
    socket.on('chatClearUserMessages', (data: ChatClearUserMessagesData) => onRemoveUserMsg(data));
    socket.on('chatMessageDelete', (data: ChatMessageDeleteData) => onRemoveSingleMsg(data));
    socket.on('chatClear', () => onRemoveAllMsg());
    socket.on('chatSharedChat', (data: SharedChatData) => onSharedChatMsg(data));

    socket.on('disconnect', () => {
        console.log("Disconnected");
    });
};
