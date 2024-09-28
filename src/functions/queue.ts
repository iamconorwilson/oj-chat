const queue: QueueItem[] = [];

const history: QueueItem[] = [];

const enqueue = (target: string, message: any) => {

    const item = {
        target: target,
        message: message
    }

    queue.push(item);
}

const dequeue = () => {
    const item = queue.shift();
    if (!item) return null;

    addHistory(item);
    return item;
}

const size = () => {
    return queue.length;
}

const getHistory = () => {
    return history;
}

const addHistory = (item: QueueItem): void => {

    if (item.target === 'removeSingleMessage') {
        const index = history.findIndex(i => i.message.id === item.message.id);
        if (index > -1) {
            history.splice(index, 1);
        }
        return;
    }

    if (item.target === 'removeUserMessages') {
        const indexes = history.filter(i => i.message.userId === item.message.user.userId);
        indexes.forEach(i => {
            const index = history.indexOf(i);
            if (index > -1) {
                history.splice(index, 1);
            }
        });
        return;
    }

    if (item.target === 'removeAllMessages') {
        history.splice(0, history.length);
        return;
    }

    history.push(item);

    if (history.length > 20) {
        history.shift();
    }
    
    return;
}


export { enqueue, dequeue, size, getHistory }