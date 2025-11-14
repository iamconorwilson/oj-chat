interface TwitchBadgeVersion {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
}

interface TwitchBadge {
  set_id: string;
  versions: TwitchBadgeVersion[];
}