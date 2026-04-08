export interface User {
  id: string;
  displayName: string;
  color: string;
  pronouns: string | null;
}

export interface Badge {
  url: string;
  title: string;
}

export interface SharedChatSource {
  fromChannelProfileImageUrl: string;
  fromChannelDisplayName: string;
}

export interface Redemption {
  title: string;
  cost: number;
}

export interface ChatMessageData {
  id: string;
  message: string;
  user: User;
  badges: Badge[] | null;
  sharedChat: SharedChatSource | null;
  redemption: Redemption | null;
  isHighlight: boolean;
}

export interface ChatClearUserMessagesData {
  id: string;
}

export interface ChatMessageDeleteData {
  id: string;
}

export interface SharedChatParticipant {
  id: string;
  displayName: string;
  profileImageUrl: string;
}

export interface SharedChatData {
  participants: SharedChatParticipant[];
}
