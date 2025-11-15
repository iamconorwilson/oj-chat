interface TwitchChannelChatMessageTextFragment {
  type: "text";
  text: string;
}

interface TwitchChannelChatMessageEmoteFragment {
  type: "emote";
  text: string;
  emote: {
    id: string;
    emote_set_id: string;
    owner_id: string;
    format: string[];
  }
}

interface TwitchChannelChatMessageCheermoteFragment {
  type: "cheermote";
  text: string;
  cheermote: {
    prefix: string;
    bits: number;
    tier: number;
  }
}

interface TwitchChannelChatMessageMentionFragment {
  type: "mention";
  text: string;
  mention: {
    user_id: string;
    user_login: string;
    user_name: string;
  }
}

type TwitchChannelChatMessageFragment = TwitchChannelChatMessageTextFragment | TwitchChannelChatMessageEmoteFragment | TwitchChannelChatMessageCheermoteFragment | TwitchChannelChatMessageMentionFragment;


interface TwitchChannelChatBadge {
  set_id: string;
  id: string;
  info: string;
}

interface TwitchChannelChatMessage {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  source_broadcaster_user_id: string | null;
  source_broadcaster_user_login: string | null;
  source_broadcaster_user_name: string | null;
  chatter_user_id: string;
  chatter_user_login: string;
  chatter_user_name: string;
  message_id: string;
  source_message_id: string | null;
  is_source_only: boolean | null;
  message: {
    text: string;
    fragments: TwitchChannelChatMessageFragment[];
  };
  color: string | null;
  badges: TwitchChannelChatBadge[];
  source_badges: TwitchChannelChatBadge[] | null;
  message_type: string;
  cheer: null;
  reply: null;
  channel_points_custom_reward_id: null;
  channel_points_animation_id: null;
}

interface TwitchChannelChatClear {
  broadcaster_user_id: string;
  broadcaster_user_name: string;
  broadcaster_user_login: string;
}

interface TwitchChannelChatClearUserMessages {
  broadcaster_user_id: string;
  broadcaster_user_name: string;
  broadcaster_user_login: string;
  target_user_id: string;
  target_user_name: string;
  target_user_login: string;
}

interface TwitchChannelSharedChat {
  session_id: string;
  broadcaster_user_id: string;
  broadcaster_user_name: string;
  broadcaster_user_login: string;
  host_broadcaster_user_id: string;
  host_broadcaster_user_name: string;
  host_broadcaster_user_login: string;
  participants: {
    broadcaster_user_id: string;
    broadcaster_user_name: string;
    broadcaster_user_login: string;
  }[];
}

interface TwitchChannelChatMessageDelete extends TwitchChannelChatClearUserMessages {
  message_id: string;
}

type Messages = TwitchChannelChatClear | TwitchChannelChatClearUserMessages | TwitchChannelChatMessage | TwitchChannelChatMessageDelete | TwitchChannelSharedChat;