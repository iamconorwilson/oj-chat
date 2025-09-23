
const history: QueueItem[] = [];

export const addHistory = (item: QueueItem) => {
    item.timestamp = Date.now();
    history.push(item);
    //limit history to last 10 messages
    if (history.length > 10) {
        history.shift();
    }

    console.log("History: ", history);
}

export const getHistory = () => {
    const limit = Date.now() - 12 * 60 * 60 * 1000; // 12 hours
    const recentHistory = history.filter(item => item.timestamp && item.timestamp > limit);
    // Clear out old history
    history.splice(0, history.length, ...recentHistory);
    return history;
}