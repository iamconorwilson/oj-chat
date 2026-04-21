import { wsConnect } from './socket.js';

export const globalData = {
    ignoredUsers: ['robo_oj', 'sockubot', 'nightbot', 'streamlabs', 'streamelements', 'tangiabot'],
    hideCommands: true,
    messagesLimit: 20
};

const init = () => {
    if (!window.IS_PRODUCTION) {
        new EventSource('/esbuild').addEventListener('change', (e) => {
            const { added, removed, updated } = JSON.parse(e.data);
            if (!added.length && !removed.length && updated.length === 1 && updated[0].endsWith('.css')) {
                for (const link of document.getElementsByTagName("link")) {
                    const url = new URL(link.href);
                    if (url.host === location.host && url.pathname === updated[0]) {
                        const next = link.cloneNode() as HTMLLinkElement;
                        next.href = updated[0] + '?' + Math.random().toString(36).slice(2);
                        next.onload = () => link.remove();
                        link.parentNode?.insertBefore(next, link.nextSibling);
                        return;
                    }
                }
            }
            location.reload();
        });
    }

    const urlParams = new window.URLSearchParams(window.location.search);


    if (urlParams.has('horizontal')) {
        document.body.classList.add('horizontal');
    }

    if (urlParams.has('transparent')) {
        document.body.classList.add('transparent');
    }

    if (urlParams.has('large')) {
        document.documentElement.style.fontSize = '24px';
    }

    wsConnect();
};

init();
