//GLOBAL DATA
const globalData = {
    ignoredUsers: ['robo_oj'],
    hideCommands: true,
    messagesLimit: 10
};

let eventQueue = [];
let totalMessages = 0;

//DOM ELEMENTS
const container = document.getElementById("container");

//INIT FUNCTION
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
    }

    //if url params has transparent
    if (urlParams.has('transparent')) {
        container.classList.add('transparent');
    }

    //if url params has large
    if (urlParams.has('large')) {
        container.classList.add('large');
    }


    //load socket.io script
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    document.head.appendChild(script);

    //once socket.io script is loaded
    script.onload = () => {
        const socket = io();

        window.onerror = (message, source, lineno, colno, error) => {
            console.error(error);
            socket.emit('clientError', { message, source, lineno, colno, error: error.toString() });
            return false; // Prevent the default error handling
        };

        socket.on("connect", () => {
            console.log("Connected");
        });

        socket.on("version", (version) => {
            console.log(`OJ CHAT -- Version: ${version}`);
        });

        //on message
        socket.on("newMessage", (msg) => {
            eventQueue.push(msg);
            processEventQueue();
        });

        //on remove all messages from user
        socket.on("removeUserMessages", onRemoveUserMsg);

        //on remove single message
        socket.on("removeSingleMessage", onRemoveSingleMsg);

        //on remove all messages
        socket.on("removeAllMessages", onRemoveAllMsg);

    }

};

//FUNCTIONS
const processEventQueue = () => {
    if (eventQueue.length > 0) {
        const nextEvent = eventQueue.shift();
        console.log(JSON.stringify(nextEvent));
        onMsgEvent(nextEvent);
    }
}

const newMessage = async (data) => {
    if (data.message.startsWith("!") && globalData.hideCommands) return console.log('Command is hidden');
    if (globalData.ignoredUsers.includes(data.user.displayName)) return console.log('User is ignored');
    if (container.querySelector(`[data-msgId="${data.id}"]`)) return console.log('Message already exists');

    totalMessages++;

    let highlight = data.highlight ? 'highlight' : '';

    let message = `<span class="user-message ${highlight}">${data.message}</span>`;
    let user = await buildUser(data);
    
    //create div element
    let html = document.createElement('div');

    //set attributes
    html.setAttribute('data-userId', data.user.userId);
    html.setAttribute('data-msgId', data.id);
    html.setAttribute('id', `msg-${totalMessages}`);

    html.classList.add('message-row');

    //set inner html
    html.innerHTML = user + message;

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


    if (newMessageElement === undefined) return;

    if (eventQueue.length > 10) {
        newMessageElement.style.animation = 'none';
    }

    container.appendChild(newMessageElement);

    //remove old messages
    if (totalMessages > globalData.messagesLimit) {
        const firstMessage = container.querySelector(`#msg-${totalMessages - globalData.messagesLimit}`);
        firstMessage.classList.add('fade-out');
        setTimeout(() => {
            firstMessage.remove();
        }, 2000);
    }

    processEventQueue();
}

const onRemoveUserMsg = (data) => {
    const { id } = data;

    const messages = container.querySelectorAll(`[data-userId="${id}"]`);

    messages.forEach(msg => {
        msg.remove();
    });
}

const onRemoveSingleMsg = () => {
    const { id } = data;

    const message = container.querySelector(`[data-msgId="${id}"]`);

    message.remove();
}

const onRemoveAllMsg = () => {
    container.innerHTML = '';
}



//init
init();
