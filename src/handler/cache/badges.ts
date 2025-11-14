import { TwitchProvider } from '../../api/twitch.js';

type BadgeVersion = {
  id: string;
  image_url: string;
};

type TwitchBadgeVersion = {
  id: string;
  image_url_4x: string;
};

export class BadgeCache {
  private static instance: BadgeCache | null = null;
  private badgeCache = new Map<string, BadgeVersion[]>();

  private constructor() {
    this.initialize();
  }

  public static getInstance(): BadgeCache {
    if (!BadgeCache.instance) {
      BadgeCache.instance = new BadgeCache();
    }
    return BadgeCache.instance;
  }

  private async initialize(): Promise<void> {
    const client = await TwitchProvider.getInstance();
    const userId = client.me ? client.me.id : null;
    const chatApi = client.chat;

    try {
      const globalBadges = await chatApi.getGlobalBadges();
      globalBadges.data.forEach(badge => {
        this.cacheBadgeSet(badge.set_id, badge.versions);
      });
    } catch (err) {
      console.error('Error fetching global badges:', err);
    }

    if (!userId) {
      console.error('Could not get current user for badge caching.');
      return;
    }

    try {
      const channelBadges: { data: TwitchBadge[] } = await chatApi.getChannelBadges(userId);
      channelBadges.data.forEach(badge => {
        this.cacheBadgeSet(badge.set_id, badge.versions);
      });
    } catch (err) {
      console.error('Error fetching channel badges:', err);
    }
  }

  public getBadgeFromCache(set_id: string, version_id: string) {
    const versions = this.badgeCache.get(set_id);
    if (!versions) return null;
    const version = versions.find(v => v.id === version_id);
    if (!version) return null;
    return {
      set_id,
      version_id: version.id,
      image_url: version.image_url
    };
  }

  private cacheBadgeSet(set_id: string, versions: TwitchBadgeVersion[]) {
    const mappedVersions = versions.map(v => ({
      id: v.id,
      image_url: v.image_url_4x
    }));
    this.badgeCache.set(set_id, mappedVersions);
  }
}