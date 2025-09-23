import { emit } from "./server.js";
import { addHistory } from "./history.js";

const queue: QueueItem[] = [];

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

const processQueue = () => {
    while (size() > 0) {
        const item = dequeue();
        if (!item) return;
        console.log(`Emitting: ${item.target} - `, item);
        emit(item.target, item.message);
    }
}


export { enqueue, dequeue, size, processQueue }