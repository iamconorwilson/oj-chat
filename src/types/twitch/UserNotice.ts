import type { TwitchChannelChatMessageFragment, TwitchChannelChatBadge } from "./ChatMessages.js";

export interface TwitchChannelChatNotificationBase {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  chatter_user_id: string;
  chatter_user_login: string;
  chatter_user_name: string;
  chatter_is_anonymous: boolean;
  color: string;
  badges: TwitchChannelChatBadge[];
  system_message: string;
  message_id: string;
  message: { text: string; fragments: TwitchChannelChatMessageFragment[] };
}

export type TwitchSubTier = "1000" | "2000" | "3000";

export interface NoticeSub {
  sub_tier: TwitchSubTier;
  is_prime: boolean;
  duration_months: number;
}

export interface NoticeResub {
  cumulative_months: number;
  duration_months: number;
  streak_months: number | null;
  sub_tier: TwitchSubTier;
  is_prime: boolean;
  is_gift: boolean;
  gifter_is_anonymous: boolean | null;
  gifter_user_id: string | null;
  gifter_user_name: string | null;
  gifter_user_login: string | null;
}

export interface NoticeSubGift {
  duration_months: number;
  cumulative_total: number | null;
  recipient_user_id: string;
  recipient_user_login: string;
  recipient_user_name: string;
  sub_tier: TwitchSubTier;
  community_gift_id: string | null;
}

export interface NoticeCommunitySubGift {
  id: string;
  total: number;
  sub_tier: TwitchSubTier;
}

export interface NoticeGiftPaidUpgrade {
  gifter_is_anonymous: boolean;
  gifter_user_id: string | null;
  gifter_user_name: string | null;
}

export interface NoticePrimePaidUpgrade {
  sub_tier: TwitchSubTier;
}

export interface NoticePayForward {
  gifter_is_anonymous: boolean;
  gifter_user_id: string | null;
  gifter_user_name: string | null;
  gifter_user_login: string | null;
}

export interface NoticeRaid {
  user_id: string;
  user_name: string;
  user_login: string;
  viewer_count: number;
  profile_image_url: string;
}

export interface NoticeAnnouncement {
  color: string;
}

export interface NoticeBitsBadgeTier {
  tier: number;
}

export interface NoticeCharityDonation {
  charity_name: string;
  amount: {
    value: number;
    decimal_places: number;
    currency: string;
  }
}

export interface NoticeWatchStreak {
  streak_count: number;
  channel_points_awarded: number;
}

export interface TwitchChannelSubNotice extends TwitchChannelChatNotificationBase {
  notice_type: "sub";
  sub: NoticeSub;
}

export interface TwitchChannelResubNotice extends TwitchChannelChatNotificationBase {
  notice_type: "resub";
  resub: NoticeResub;
}

export interface TwitchChannelSubGiftNotice extends TwitchChannelChatNotificationBase {
  notice_type: "subgift";
  sub_gift: NoticeSubGift;
}

export interface TwitchChannelCommunitySubGiftNotice extends TwitchChannelChatNotificationBase {
  notice_type: "community_subgift";
  community_sub_gift: NoticeCommunitySubGift;
}

export interface TwitchChannelGiftPaidUpgradeNotice extends TwitchChannelChatNotificationBase {
  notice_type: "gift_paid_upgrade";
  gift_paid_upgrade: NoticeGiftPaidUpgrade;
}

export interface TwitchChannelPrimePaidUpgradeNotice extends TwitchChannelChatNotificationBase {
  notice_type: "prime_paid_upgrade";
  prime_paid_upgrade: NoticePrimePaidUpgrade;
}

export interface TwitchChannelPayForwardNotice extends TwitchChannelChatNotificationBase {
  notice_type: "pay_forward";
  pay_forward: NoticePayForward;
}

export interface TwitchChannelRaidNotice extends TwitchChannelChatNotificationBase {
  notice_type: "raid";
  raid: NoticeRaid;
}

export interface TwitchChannelAnnouncementNotice extends TwitchChannelChatNotificationBase {
  notice_type: "announcement";
  announcement: NoticeAnnouncement;
}

export interface TwitchChannelBitsBadgeTierNotice extends TwitchChannelChatNotificationBase {
  notice_type: "bits_badge_tier";
  bits_badge_tier: NoticeBitsBadgeTier;
}

export interface TwitchChannelCharityDonationNotice extends TwitchChannelChatNotificationBase {
  notice_type: "charity_donation";
  charity_donation: NoticeCharityDonation;
}

export interface TwitchChannelWatchStreakNotice extends TwitchChannelChatNotificationBase {
  notice_type: "watch_streak";
  watch_streak: NoticeWatchStreak;
}

export type TwitchChannelChatNotification =
  | TwitchChannelSubNotice
  | TwitchChannelResubNotice
  | TwitchChannelSubGiftNotice
  | TwitchChannelCommunitySubGiftNotice
  | TwitchChannelGiftPaidUpgradeNotice
  | TwitchChannelPrimePaidUpgradeNotice
  | TwitchChannelPayForwardNotice
  | TwitchChannelRaidNotice
  | TwitchChannelAnnouncementNotice
  | TwitchChannelBitsBadgeTierNotice
  | TwitchChannelCharityDonationNotice
  | TwitchChannelWatchStreakNotice;
