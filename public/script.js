//GLOBAL DATA
const globalData = {
    ignoredUsers: [],
    hideCommands: false,
    totalMessages: 0,
    messagesLimit: 10
};

const init = async () => {
    //if query params
    const urlParams = new URLSearchParams(window.location.search);

    //if url params has horizontal
    if (urlParams.has('horizontal')) {
        //load horizontal css
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '/css/horizontal.css';
        document.head.appendChild(css);
    } else {
        //load default css
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '/css/styles.css';
        document.head.appendChild(css);
    }

    //load socket.io script
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    document.head.appendChild(script);

    //once socket.io script is loaded
    script.onload = () => {
        const socket = io();

        socket.on("connect", () => {
            console.log("connected");
        });

        //on message
        socket.on("newMessage", onMsgEvent);

        //on remove all messages from user
        socket.on("removeUserMessages", onRemoveUserMsg);

        //on remove single message
        socket.on("removeSingleMessage", onRemoveSingleMsg);

        //on remove all messages
        socket.on("removeAllMessages", onRemoveAllMsg);

    }

};







const newMessage = async (data) => {
    if (data.message.startsWith("!") && globalData.hideCommands) return;
    if (globalData.ignoredUsers.includes(data.user.displayName)) return;

    globalData.totalMessages++;

    let message = `<span class="user-message">${data.message}</span>`;
    let user = await buildUser(data);
    
    //create div element
    let html = document.createElement('div');

    //set attributes
    html.setAttribute('data-userId', data.user.userId);
    html.setAttribute('data-msgId', data.id);
    html.setAttribute('id', `msg-${globalData.totalMessages}`);

    html.classList.add('message-row');

    //set inner html
    html.innerHTML = `${user}${message}`;

    return html;
};

const buildUser = async (data) => {
    const { badges, user, color, pronouns, redemption } = data;

    let badge = '';

    if (pronouns) {
        badge += `<span class="pronoun">${pronouns}</span>`;
    }

    //get badges
    badges.forEach(b => {
        badge += `<img alt="" src="${b.imageUrl}" class="badge ${b.title}"> `;
    });

    //get redemptions
    const redemptionHtml = redemption !== null ? `<span class="redemption">Redeemed <span class="title">${redemption.title}</span> <span class="cost">${redemption.cost}</span></span>` : '';

    return `<span class="user-box">${badge} <span style="color: ${color}">${user.displayName}</span>${redemptionHtml}</span>`;
}

const onMsgEvent = async (msg) => {
    console.log(msg);
    const newMessageElement = await newMessage(msg);

    const container = document.getElementById("container");

    if (newMessageElement === undefined) return;

    container.appendChild(newMessageElement);

    //remove old messages
    if (globalData.totalMessages > globalData.messagesLimit) {
        const firstMessage = document.getElementById(`msg-${globalData.totalMessages - globalData.messagesLimit}`);
        firstMessage.remove();
    }
}

const onRemoveUserMsg = (data) => {
    const { userId } = data;

    const messages = document.querySelectorAll(`[data-userId="${userId}"]`);

    messages.forEach(msg => {
        msg.remove();
    });
}

const onRemoveSingleMsg = () => {
    const { id } = data;

    const message = document.querySelector(`[data-msgId="${id}"]`);

    message.remove();
}

const onRemoveAllMsg = () => {
    const container = document.getElementById("container");
    container.innerHTML = '';
}

//init
init();