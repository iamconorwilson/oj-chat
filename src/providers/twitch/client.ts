import { TwitchProvider } from './api.js';
import { TwitchEventSubClient } from './routes/eventsub-ws.js';
import { MessageQueue } from '../../queue.js';


// HELPER FUNCTIONS

const broadcasterAndUser = (userId: string) => ({
  broadcaster_user_id: userId,
  user_id: userId
});

const broadcasterOnly = (userId: string) => ({
  broadcaster_user_id: userId
});

const eventSubs = [
  { type: 'channel.chat.message', version: '1', condition: broadcasterAndUser },
  { type: 'channel.chat.clear', version: '1', condition: broadcasterAndUser },
  { type: 'channel.chat.clear_user_messages', version: '1', condition: broadcasterAndUser },
  { type: 'channel.chat.message_delete', version: '1', condition: broadcasterAndUser },
  { type: 'channel.chat.notification', version: '1', condition: broadcasterAndUser },
  { type: 'channel.shared_chat.begin', version: '1', condition: broadcasterOnly }
];

export const createClient = async () => {

  const client = await TwitchProvider.getInstance();

  const listener = TwitchEventSubClient.getInstance(client);

  const queue = MessageQueue.getInstance();



  listener.on('connect', async () => {
    const me = client.me;
    if (!me) {
      console.error('Could not get current user for subscriptions.');
      return;
    }
    const userId = me.id;

    await Promise.all(eventSubs.map(async (eventSub) => {
      const { type, version, condition } = eventSub;
      try {
        await listener.createSubscription(type, version, condition(userId));
        listener.on(type, (eventData) => {
          const event = {
            provider: 'twitch',
            type: type,
            data: eventData
          };
          queue.enqueue(event);
        });
        console.log(`Subscribed to Twitch event: ${type}`);
      } catch (error) {
        console.error(`Subscription to ${type} failed:`, error);
      }
    }));

    listener.on('revocation', (revokedSub) => {
      console.warn(`Subscription revoked: ${revokedSub.type} (Status: ${revokedSub.status})`);
    });
  });

  console.log('Twitch EventSub listener ready to connect');

}

export const reconnectClient = async () => {
  const listener = TwitchEventSubClient.getInstance();
  listener.connect();
}

export const disconnectClient = async () => {
  const listener = TwitchEventSubClient.getInstance();
  const existingSubs = await listener.getSubscriptions();
  if (existingSubs.length > 0) {
    await Promise.all(existingSubs.map(sub => listener.deleteSubscription(sub.id)));
    console.log(`Cleared ${existingSubs.length} existing Twitch EventSub subscriptions`);
  }
  listener.disconnect();
}
