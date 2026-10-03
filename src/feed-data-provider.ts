import NodeCache from 'node-cache';
import * as z from 'zod';

export const feedDataProviderConfigurationSchema = z.object({
  cacheFeedDataTimeToLive: z.number().default(0),
  cacheFeedContentTimeToLive: z.number().default(0),
});

export type FeedDataProviderConfiguration = z.infer<typeof feedDataProviderConfigurationSchema>;

export type ContentMimeType = 'video/mp4' | 'application/x-mpegURL' | 'audio/mp3';

export type FeedData = {
  feedId: string;
  title: string;
  description: string;
  feedUrl: string;
  sourceUrl: string;
  imageUrl: string;
};

export type FeedContent = {
  contentId: string;
  title: string;
  description: string;
  date: Date;
  duration?: number | undefined;
  contentUrl: string;
  mimeType: ContentMimeType;
  sourceUrl: string;
  imageUrl?: string;
};

export const createFeedDataProvider = <TFeedDataOptions extends { baseUrl: string } = { baseUrl: string }>(
  config: FeedDataProviderConfiguration,
  fetchFeedData: (feedId: string, options: TFeedDataOptions) => Promise<FeedData>,
  fetchFeedContent: (feedData: FeedData, options: TFeedDataOptions) => Promise<FeedContent[]>,
) => {
  const cache = new NodeCache();

  const getFeedDataWithContent = async (feedId: string, options: TFeedDataOptions) => {
    const feedDataCacheKey = `feed-data-${feedId}`;

    const cachedFeedData = cache.get<FeedData>(feedDataCacheKey);

    if (cachedFeedData) {
      const content = await getFeedContent(cachedFeedData, options);
      return { ...cachedFeedData, content };
    }

    const feedData = await fetchFeedData(feedId, options);

    const { cacheFeedDataTimeToLive } = config;

    if (cacheFeedDataTimeToLive) {
      cache.set(feedDataCacheKey, { ...feedData, content: undefined }, cacheFeedDataTimeToLive);
    }

    const content = await getFeedContent(feedData, options);
    return { ...feedData, content };
  };

  const getFeedContent = async (feedData: FeedData, options: TFeedDataOptions) => {
    const feedContentCacheKey = `feed-content-${feedData.feedId}`;

    const cachedFeedContent = cache.get<FeedContent[]>(feedContentCacheKey);

    if (cachedFeedContent) {
      return cachedFeedContent;
    }

    const feedContent = await fetchFeedContent(feedData, options);

    const { cacheFeedContentTimeToLive } = config;

    if (cacheFeedContentTimeToLive) {
      cache.set(feedContentCacheKey, feedContent, cacheFeedContentTimeToLive);
    }

    return feedContent;
  };

  return { getFeedDataWithContent };
};

export type FeedDataProvider<TFeedDataOptions extends { baseUrl: string } = { baseUrl: string }> = ReturnType<
  typeof createFeedDataProvider<TFeedDataOptions>
>;
