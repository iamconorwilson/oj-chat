import { TwitchProvider } from './twitch.js';
import { TwitchEventSubClient } from './routes/eventsub-ws.js';
import { MessageQueue } from '../queue.js';

export const createClient = async () => {

  const client = await TwitchProvider.getInstance();

  const listener = new TwitchEventSubClient(client);

  const queue = MessageQueue.getInstance();

  const eventSubs = [
    { type: 'channel.chat.message', version: '1', condition: broadcasterAndUser },
    { type: 'channel.chat.clear', version: '1', condition: broadcasterAndUser },
    { type: 'channel.chat.clear_user_messages', version: '1', condition: broadcasterAndUser },
    { type: 'channel.chat.message_delete', version: '1', condition: broadcasterAndUser },
    { type: 'channel.shared_chat.begin', version: '1', condition: broadcasterOnly }
  ];

  listener.on('connect', async () => {
    const me = client.me;
    if (!me) {
      console.error('Could not get current user for subscriptions.');
      return;
    }
    const userId = me.id;

    for (const eventSub of eventSubs) {
      const { type, version, condition } = eventSub;

      try {
        await listener.subscribe(type, version, condition(userId));
        listener.on(type, (eventData) => {
          const event = {
            type: type,
            data: eventData
          }
          queue.enqueue(event);
        });
        console.log(`Subscribed to Twitch event: ${type}`);
      } catch (error) {
        console.error(`Subscription to ${type} failed:`, error);
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

// HELPER FUNCTIONS

const broadcasterAndUser = (userId: string) => ({
  broadcaster_user_id: userId,
  user_id: userId
});

const broadcasterOnly = (userId: string) => ({
  broadcaster_user_id: userId
});