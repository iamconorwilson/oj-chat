import { wsConnect } from './socket';
import { containerWrap } from './dom';

export const globalData = {
    ignoredUsers: ['robo_oj', 'sockubot', 'nightbot', 'streamlabs', 'streamelements', 'tangiabot'],
    hideCommands: true,
    messagesLimit: 20
};

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

// INIT
init();
