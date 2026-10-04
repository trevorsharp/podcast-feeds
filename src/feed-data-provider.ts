import * as z from 'zod';

import { withCache } from './utilities/cache';
import type { PartialShape } from './utilities/zod';

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
  mimeType: 'video/mp4' | 'application/x-mpegURL' | 'audio/mp3';
  sourceUrl: string;
  imageUrl?: string;
};

export const feedDataProviderConfigurationSchema = z.object({
  cacheFeedDataTimeToLive: z.number().default(0),
  cacheFeedContentTimeToLive: z.number().default(0),
});

type Configuration = PartialShape<typeof feedDataProviderConfigurationSchema.shape>;

type CreateFeedDataProviderOptions = {
  configuration: Configuration;
  fetchFeedData: (feedId: string, options: { baseUrl: string }) => Promise<FeedData>;
  fetchFeedContent: (feedData: FeedData, options: { baseUrl: string }) => Promise<FeedContent[]>;
};

export const createFeedDataProvider = ({
  configuration,
  fetchFeedData,
  fetchFeedContent,
}: CreateFeedDataProviderOptions) => {
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

  const getFeedDataWithContent = async (feedId: string, options: { baseUrl: string }) => {
    const feedData = await getFeedData(feedId, options);
    const content = await getFeedContent(feedData, options);
    return { ...feedData, content };
  };

  return { getFeedDataWithContent };
};

export type FeedDataProvider = ReturnType<typeof createFeedDataProvider>;
