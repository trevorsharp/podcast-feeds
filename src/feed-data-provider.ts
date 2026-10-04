import * as z from 'zod';

import { withCache } from './utilities/cache';

export const feedDataProviderConfigurationSchema = z.object({
  cacheFeedDataTimeToLive: z.number().default(0),
  cacheFeedContentTimeToLive: z.number().default(0),
});

export type FeedDataProviderConfiguration = z.infer<typeof feedDataProviderConfigurationSchema>;

export type BaseFeedOptions = { baseUrl: string };

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

export const createFeedDataProvider = <TFeedDataOptions extends BaseFeedOptions = BaseFeedOptions>(
  configuration: unknown,
  fetchFeedData: (feedId: string, options: TFeedDataOptions) => Promise<FeedData>,
  fetchFeedContent: (feedData: FeedData, options: TFeedDataOptions) => Promise<FeedContent[]>,
) => {
  const config = feedDataProviderConfigurationSchema.parse(configuration);

  const getFeedData = withCache(
    {
      cacheKey: 'feed-data',
      timeToLive: config.cacheFeedDataTimeToLive,
    },
    fetchFeedData,
  );

  const getFeedContent = withCache(
    {
      cacheKey: 'feed-content',
      timeToLive: config.cacheFeedContentTimeToLive,
    },
    fetchFeedContent,
  );

  const getFeedDataWithContent = async (feedId: string, options: TFeedDataOptions) => {
    const feedData = await getFeedData(feedId, options);
    const content = await getFeedContent(feedData, options);
    return { ...feedData, content };
  };

  return { getFeedDataWithContent };
};

export type FeedDataProvider<TFeedDataOptions extends BaseFeedOptions = BaseFeedOptions> = ReturnType<
  typeof createFeedDataProvider<TFeedDataOptions>
>;
