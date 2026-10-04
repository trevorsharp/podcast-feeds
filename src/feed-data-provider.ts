import * as z from 'zod';

import { withCache } from './cache';
import { sendEvent } from './events';
import type { FeedContent, FeedData } from './types';
import type { ConfigurationFrom } from './utilities/zod';

const feedDataProviderConfigurationSchema = z.object({
  cacheFeedDataTimeToLive: z.number().default(0),
  cacheFeedContentTimeToLive: z.number().default(0),
});

type CreateFeedDataProviderOptions = ConfigurationFrom<typeof feedDataProviderConfigurationSchema.shape> & {
  fetchFeedData: (feedId: string, options: { baseUrl: string }) => Promise<FeedData | undefined>;
  fetchFeedContent: (feedData: FeedData, options: { baseUrl: string }) => Promise<FeedContent[]>;
};

export const createFeedDataProvider = ({
  configuration,
  fetchFeedData,
  fetchFeedContent,
}: CreateFeedDataProviderOptions) => {
  const config = feedDataProviderConfigurationSchema.parse(configuration ?? {});

  const getFeedData = withCache(
    {
      cacheKey: (feedId, { baseUrl }) => `feed-data-${feedId}-${baseUrl}`,
      timeToLive: config.cacheFeedDataTimeToLive,
    },
    fetchFeedData,
  );

  const getFeedContent = withCache(
    {
      cacheKey: ({ feedId }, { baseUrl }) => `feed-content-${feedId}-${baseUrl}`,
      timeToLive: config.cacheFeedContentTimeToLive,
    },
    fetchFeedContent,
  );

  const getFeedDataWithContent = async (feedId: string, options: { baseUrl: string }) => {
    const feedData = await getFeedData(feedId, options);

    if (!feedData) {
      return undefined;
    }

    const content = await getFeedContent(feedData, options);

    const feedDataWithContent = { ...feedData, content };

    sendEvent('feed-data-with-content-loaded', feedDataWithContent);

    return feedDataWithContent;
  };

  return { getFeedDataWithContent };
};

export type FeedDataProvider = ReturnType<typeof createFeedDataProvider>;
