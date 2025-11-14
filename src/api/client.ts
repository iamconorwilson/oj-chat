import { TwitchProvider } from './twitch.js';
import { TwitchEventSubClient } from './routes/eventsub-ws.js';
import { MessageQueue } from '../queue.js';

export const createClient = async () => {

  const client = await TwitchProvider.getInstance();

  const listener = new TwitchEventSubClient(client);

  const queue = MessageQueue.getInstance();

  const eventTypes = [
    'channel.chat.message',
    'channel.chat.clear',
    'channel.chat.clear_user_messages',
    'channel.chat.message_delete'
  ];

  listener.on('connect', async () => {
    const me = client.me;
    if (!me) {
      console.error('Could not get current user for subscriptions.');
      return;
    }
    const userId = me.id;

    for (const eventType of eventTypes) {
      try {
        await listener.subscribe(eventType, '1', {
          broadcaster_user_id: userId,
          user_id: userId
        });
        listener.on(eventType, (eventData) => {
          const event = {
            type: eventType,
            data: eventData
          }
          queue.enqueue(event);
        });
        console.log(`Subscribed to Twitch event: ${eventType}`);
      } catch (error) {
        console.error(`Subscription to ${eventType} failed:`, error);
      }
    }

    listener.on('disconnect', () => {
      console.warn('EventSub client disconnected.');
      listener.connect();
    });

  });


  await listener.connect();

  return listener;
}