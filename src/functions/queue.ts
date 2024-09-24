const queue: QueueItem[] = [];

const enqueue = (target: string, message: any) => {

    const item = {
        target: target,
        message: message
    }

    queue.push(item);
}

const dequeue = () => {
    return queue.shift();
}

const size = () => {
    return queue.length;
}


export { enqueue, dequeue, size }