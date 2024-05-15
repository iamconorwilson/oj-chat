const queue = [];

const enqueue = (target, message) => {

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