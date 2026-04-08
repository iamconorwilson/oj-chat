import { fixColor } from './color';
import { ChatMessageData, SharedChatData } from './types';
import { globalData } from './script';

export const containerWrap = document.getElementById("container-wrap") as HTMLElement;
export const container = document.getElementById("container") as HTMLElement;

let totalMessages = 0;

export const buildUserBox = async (data: ChatMessageData): Promise<string> => {
    const { badges, user, redemption, sharedChat } = data;
    let badge = '';

    if (sharedChat) {
        badge += `<img alt="" src="${sharedChat.fromChannelProfileImageUrl}" class="badge shared-chat-source" title="${sharedChat.fromChannelDisplayName}">`;
    }
    if (user.pronouns) {
        badge += `<span class="pronoun">${user.pronouns}</span>`;
    }
    if (badges && badges.length > 0) {
        badge += '<span class="badges">';
        badges.forEach(b => {
            badge += `<img alt="" src="${b.url}" class="badge ${b.title}"> `;
        });
        badge += '</span>';
    }
    const redemptionHtml = redemption ? `<span class="redemption">Redeemed <span class="title">${redemption.title}</span> <span class="cost">${redemption.cost}</span></span>` : '';

    return `<span class="user-box">${badge} <span style="color: ${fixColor(user.color)}">${user.displayName}</span>${redemptionHtml}</span>`;
};

export const newMessage = async (data: ChatMessageData): Promise<HTMLElement | undefined> => {
    if (data.message.startsWith("!") && globalData.hideCommands) return;
    if (globalData.ignoredUsers.includes(data.user.displayName)) return;
    if (container.querySelector(`[data-msgId="${data.id}"]`)) return;

    totalMessages++;

    const highlight = data.isHighlight ? 'highlight' : '';
    const message = `<span class="user-message ${highlight}">${data.message}</span>`;
    const user = await buildUserBox(data);

    const html = document.createElement('div');
    html.setAttribute('data-userId', data.user.id);
    html.setAttribute('data-msgId', data.id);
    html.setAttribute('id', `msg-${totalMessages}`);
    html.classList.add('message-row');
    html.innerHTML = user + message;

    return html;
};

export const onMsgEvent = async (msg: ChatMessageData) => {
    if (!msg) return;
    const newMessageElement = await newMessage(msg);
    if (!newMessageElement) return;

    if (document.visibilityState !== 'visible' || container.childElementCount > 10) {
        newMessageElement.style.animation = 'none';
    }

    container.appendChild(newMessageElement);

    // Remove old messages
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

export const onRemoveUserMsg = (data: { id: string }) => {
    if (!data?.id) return;
    const messages = container.querySelectorAll(`[data-userId="${data.id}"]`);
    messages.forEach(msg => msg.remove());
};

export const onRemoveSingleMsg = (data: { id: string }) => {
    if (!data?.id) return;
    const message = container.querySelector(`[data-msgId="${data.id}"]`);
    if (message) message.remove();
};

export const onRemoveAllMsg = () => {
    container.innerHTML = '';
};

export const onSharedChatMsg = (data: SharedChatData) => {
    const elements: string[] = [];
    if (!data || !data.participants || data.participants.length === 0) return;

    data.participants.forEach((participant) => {
        const img = `<img alt="" src="${participant.profileImageUrl}" class="profile" title="${participant.displayName}"> `;
        elements.push(img);
    });

    const innerHtml = `<div class="profile-group">${elements.join('')}</div><span>Shared Chat started!</span>`;

    const html = document.createElement('div');
    html.classList.add('message-row');
    html.classList.add('shared-chat-message');
    html.innerHTML = innerHtml;

    container.appendChild(html);
};
