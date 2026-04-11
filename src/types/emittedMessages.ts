
export interface ChatMessageData {
  id: string;
  message: string;
  user: {
    displayName: string;
    id: string;
    color: string;
    pronouns: string | undefined;
  };
  badges: ChatBadgeData[];
  sharedChat: SharedChatMessageData | null;
  redemption: ChatChannelPointRedemptionData | null;
  isHighlight: boolean;
}

export type SharedChatMessageData = {
  fromChannelProfileImageUrl: string;
  fromChannelDisplayName: string;
  isSourceBroadcaster: boolean;
}

export type ChatChannelPointRedemptionData = {
  title: string;
  cost: number;
}

export type ChatBadgeData = {
  title: string;
  url: string;
}

export interface EmittedChatMessage {
  type: 'chatMessage';
  data: ChatMessageData;
}

export interface EmittedChatClear {
  type: 'chatClear';
}

export interface EmittedChatClearUserMessages {
  type: 'chatClearUserMessages';
  data: { id: string }
}

export interface EmittedChatShared {
  type: 'chatSharedChat';
  data: {
    participants: {
      id: string;
      displayName: string;
      profileImageUrl: string;
    }[];
  }
}

export interface EmittedChatDelete {
  type: 'chatMessageDelete';
  data: { id: string }
}

export interface EmittedChatNotification {
  type: 'chatNotification';
  data: EmittedWatchStreak;
}

interface EmittedChatNotificationData {
  id: string;
}

interface EmittedWatchStreak extends EmittedChatNotificationData {
  notice_type: 'watch_streak';
  user: {
    displayName: string;
    id: string;
    color: string;
  };
  streak: number;
}

export type EmittedMessage = EmittedChatMessage | EmittedChatClear | EmittedChatClearUserMessages | EmittedChatShared | EmittedChatDelete | EmittedChatNotification;