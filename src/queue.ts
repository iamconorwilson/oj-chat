import EventEmitter from "events";

interface QueueMessage {
  type: string;
  data: Messages;
}

export class MessageQueue extends EventEmitter {
  private static instance: MessageQueue;
  private queue: QueueMessage[] = [];

  private constructor() {
    super();
  }

  static getInstance() {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  enqueue(message: QueueMessage) {
    this.queue.push(message);
    this.emit('messageEnqueued', message);
  }

  dequeue() {
    const message = this.queue.shift();
    this.emit('messageDequeued', message);
    return message;
  }

  size() {
    return this.queue.length;
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}