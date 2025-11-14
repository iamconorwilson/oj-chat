import { MessageQueue } from '../queue.js';
import { getUserColor, getPronouns, getSharedChat, getRedemption, parseMessageParts, parseBadges } from './utils.js';
import { Server } from '../server.js';

// --- Handler Functions ---

const chatMessageHandler = async (eventData: TwitchChannelChatMessage) => {
  const {
    message_id,
    chatter_user_name,
    chatter_user_id,
    color,
    source_broadcaster_user_id,
    broadcaster_user_id,
    channel_points_custom_reward_id,
    message_type,
    message,
    badges
  } = eventData;

  const userColor = color || getUserColor(chatter_user_name);
  const isHighlight = message_type === 'channel_points_highlighted';
  const messageHtml = parseMessageParts(message.fragments);
  const badgesArray = parseBadges(badges);

  // Run async calls in parallel
  const [userPronouns, sharedChat, redemption] = await Promise.all([
    getPronouns(chatter_user_name),
    getSharedChat(source_broadcaster_user_id),
    getRedemption(broadcaster_user_id, channel_points_custom_reward_id)
  ]);

  const wsMessage = {
    type: 'chatMessage',
    data: {
      id: message_id,
      message: messageHtml,
      user: {
        displayName: chatter_user_name,
        id: chatter_user_id,
        color: userColor,
        pronouns: userPronouns
      },
      badges: badgesArray,
      sharedChat,
      redemption,
      isHighlight
    }
  };

  Server.getInstance().emit(wsMessage);
  console.log(JSON.stringify(wsMessage, null, 2));
};

const chatClearHandler = () => {
  const wsMessage = { type: 'chatClear' };
  Server.getInstance().emit(wsMessage);
  console.log(JSON.stringify(wsMessage, null, 2));
};

const chatClearUserMessagesHandler = (eventData: TwitchChannelChatClearUserMessages) => {
  const wsMessage = {
    type: 'chatClearUserMessages',
    data: { id: eventData.target_user_id }
  };
  Server.getInstance().emit(wsMessage);
  console.log(JSON.stringify(wsMessage, null, 2));
};

const chatMessageDeleteHandler = (eventData: TwitchChannelChatMessageDelete) => {
  const wsMessage = {
    type: 'chatMessageDelete',
    data: { id: eventData.message_id }
  };
  Server.getInstance().emit(wsMessage);
  console.log(JSON.stringify(wsMessage, null, 2));
};

// --- Main Queue Handler ---

export const messageHandler = async () => {
  const queue = MessageQueue.getInstance();

  queue.on('messageEnqueued', async () => {
    while (!queue.isEmpty()) {
      const message = queue.dequeue();
      if (!message) continue;

      switch (message.type) {
        case 'channel.chat.message':
          await chatMessageHandler(message.data as TwitchChannelChatMessage);
          break;
        case 'channel.chat.clear':
          chatClearHandler();
          break;
        case 'channel.chat.clear_user_messages':
          chatClearUserMessagesHandler(message.data as TwitchChannelChatClearUserMessages);
          break;
        case 'channel.chat.message_delete':
          chatMessageDeleteHandler(message.data as TwitchChannelChatMessageDelete);
          break;
        default:
          console.warn('Unhandled message type:', message.type);
      }
    }
  });
};