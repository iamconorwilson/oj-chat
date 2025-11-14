// GLOBAL DATA
const globalData = {
    ignoredUsers: ['robo_oj', 'sockubot', 'nightbot', 'streamlabs', 'streamelements', 'tangiabot'],
    hideCommands: true,
    messagesLimit: 20
};

let eventQueue = [];
let totalMessages = 0;

// DOM ELEMENTS
const containerWrap = document.getElementById("container-wrap");
const container = document.getElementById("container");

// INIT FUNCTION
const init = () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('horizontal')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '/css/horizontal.css';
        document.head.appendChild(css);
    }

    if (urlParams.has('transparent')) {
        containerWrap.classList.add('transparent');
    }

    if (urlParams.has('large')) {
        document.documentElement.style.fontSize = '24px';
    }

    wsConnect();
};

const wsConnect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log("Connected");
    };

    window.onerror = (message, source, lineno, colno, error) => {
        console.error(error);
        ws.send(JSON.stringify({ type: 'clientError', data: { message, source, lineno, colno, error: error?.toString() } }));
        return false;
    };

    ws.onmessage = (event) => {
        let msg;
        try {
            msg = JSON.parse(event.data);
        } catch (e) {
            console.warn("Failed to parse message:", event.data);
            return;
        }
        switch (msg.type) {
            case "version":
                console.log(`Server version: ${msg.data}`);
                break;
            case "chatMessage":
                eventQueue.push(msg.data);
                processEventQueue();
                break;
            case "chatClearUserMessages":
                onRemoveUserMsg(msg.data);
                break;
            case "chatMessageDelete":
                onRemoveSingleMsg(msg.data);
                break;
            case "chatClear":
                onRemoveAllMsg();
                break;
            default:
                console.warn(`Unknown message type: ${msg.type}`);
        }
    };

    ws.onclose = () => {
        console.log("Disconnected");
        setTimeout(wsConnect, 5000);
    };
};

// Debounced queue processor
let queueProcessing = false;
const processEventQueue = () => {
    if (queueProcessing || eventQueue.length === 0) return;
    queueProcessing = true;
    requestAnimationFrame(async () => {
        const nextEvent = eventQueue.shift();
        await onMsgEvent(nextEvent);
        queueProcessing = false;
        if (eventQueue.length > 0) processEventQueue();
    });
};

const newMessage = async (data) => {
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

const buildUserBox = async (data) => {
    const { badges, user, redemption, sharedChat } = data;
    let badge = '';

    if (sharedChat) {
        badge += `<img alt="" src="${sharedChat.fromChannelProfileImageUrl}" class="badge shared-chat" title="${sharedChat.fromChannelDisplayName}"> `;
    }
    if (user.pronouns) {
        badge += `<span class="pronoun">${user.pronouns}</span>`;
    }
    badges.forEach(b => {
        badge += `<img alt="" src="${b.url}" class="badge ${b.title}"> `;
    });
    const redemptionHtml = redemption ? `<span class="redemption">Redeemed <span class="title">${redemption.title}</span> <span class="cost">${redemption.cost}</span></span>` : '';

    return `<span class="user-box">${badge} <span style="color: ${user.color}">${user.displayName}</span>${redemptionHtml}</span>`;
};

const onMsgEvent = async (msg) => {
    if (!msg) return;
    const newMessageElement = await newMessage(msg);
    if (!newMessageElement) return;

    if (eventQueue.length > 10) {
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

const onRemoveUserMsg = (data) => {
    if (!data?.id) return;
    const messages = container.querySelectorAll(`[data-userId="${data.id}"]`);
    messages.forEach(msg => msg.remove());
};

const onRemoveSingleMsg = (data) => {
    if (!data?.id) return;
    const message = container.querySelector(`[data-msgId="${data.id}"]`);
    if (message) message.remove();
};

const onRemoveAllMsg = () => {
    container.innerHTML = '';
};

// INIT
init();
