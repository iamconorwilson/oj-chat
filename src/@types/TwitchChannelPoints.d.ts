interface TwitchChannelPointsReward {
  broadcaster_name: string;
  broadcaster_id: string;
  id: string;
  image: string | null;
  background_color: string;
  is_enabled: boolean;
  cost: number;
  title: string;
  prompt: string;
  is_user_input_required: boolean;
  max_per_stream_setting: {
    is_enabled: boolean;
    max_per_stream: number;
  },
  max_per_user_per_stream_setting: {
    is_enabled: boolean;
    max_per_user_per_stream: number;
  },
  global_cooldown_setting: {
    is_enabled: boolean;
    global_cooldown_seconds: number;
  },
  is_paused: boolean;
  is_in_stock: boolean;
  default_image: {
    url_1x: string;
    url_2x: string;
    url_4x: string;
  },
  should_redemptions_skip_request_queue: boolean;
  redemptions_redeemed_current_stream: number | null;
  cooldown_expires_at: string | null;
}