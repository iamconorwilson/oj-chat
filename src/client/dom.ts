import { fixColor } from './color';
import { globalData } from './script';
import { EmittedChatMessage, EmittedChatClearUserMessages, EmittedChatDelete, EmittedChatShared, EmittedChatNotification } from '../types/emittedMessages';
import { buildNewMessage, buildSharedChat, buildWatchStreak } from './builders';

export const containerWrap = document.getElementById("container-wrap") as HTMLElement;
export const container = document.getElementById("container") as HTMLElement;

let totalMessages = 0;

export const getTotalMessages = () => totalMessages;
export const incrementTotalMessages = () => totalMessages++;

export const onMessageEvent = async (msg: EmittedChatMessage['data']) => {
    if (!msg) return;
    const newMessageElement = await buildNewMessage(msg);
    if (!newMessageElement) return;

    if (document.visibilityState !== 'visible' || container.childElementCount > 10) {
        newMessageElement.style.animation = 'none';
    }

    container.appendChild(newMessageElement);
    removeOldMessages();
};

export const onNotificationEvent = async (data: EmittedChatNotification['data']) => {
    if (data.notice_type === 'watch_streak') {
        const html = await buildWatchStreak(data);
        if (!html) return;

        container.appendChild(html);
        removeOldMessages();
    }
};

export const onRemoveUserMsg = (data: EmittedChatClearUserMessages['data']) => {
    if (!data?.id) return;
    const messages = container.querySelectorAll(`[data-userId="${data.id}"]`);
    messages.forEach(msg => msg.remove());
};

export const onRemoveSingleMsg = (data: EmittedChatDelete['data']) => {
    if (!data?.id) return;
    const message = container.querySelector(`[data-msgId="${data.id}"]`);
    if (message) message.remove();
};

export const onRemoveAllMsg = () => {
    container.innerHTML = '';
};

export const onSharedChatMsg = async (data: EmittedChatShared['data']) => {
    if (!data || !data.participants || data.participants.length === 0) return;

    const html = await buildSharedChat(data);
    if (!html) return;

    container.appendChild(html);
    removeOldMessages();
};

const removeOldMessages = () => {
    if (totalMessages > globalData.messagesLimit) {
        const firstMessage = container.querySelector(`#msg-${totalMessages - globalData.messagesLimit}`);
        if (firstMessage) {
            firstMessage.classList.add('fade-out');
            setTimeout(() => {
                firstMessage.remove();
            }, 2000);
        }
    }
};

if (typeof window !== 'undefined') {
    (window as any).onMessageEvent = onMessageEvent;
    (window as any).onNotificationEvent = onNotificationEvent;
    (window as any).onRemoveUserMsg = onRemoveUserMsg;
    (window as any).onRemoveSingleMsg = onRemoveSingleMsg;
    (window as any).onRemoveAllMsg = onRemoveAllMsg;
    (window as any).onSharedChatMsg = onSharedChatMsg;
}