import * as z from 'zod';

import { withCache } from './cache';
import type { ConfigurationFrom } from './utilities/zod';

const streamingProviderConfigurationSchema = z.object({
  cacheStreamingUrlTimeToLive: z.number().default(0),
});

type CreateStreamingProviderOptions = ConfigurationFrom<typeof streamingProviderConfigurationSchema.shape> & {
  fetchStreamingUrl: (contentId: string) => Promise<string>;
};

export const createStreamingProvider = ({ configuration, fetchStreamingUrl }: CreateStreamingProviderOptions) => {
  const config = streamingProviderConfigurationSchema.parse(configuration ?? {});

  const getStreamingUrl = withCache(
    {
      cacheKey: (contentId) => `streaming-url-${contentId}`,
      timeToLive: config.cacheStreamingUrlTimeToLive,
    },
    fetchStreamingUrl,
  );

  return { getStreamingUrl };
};

export type StreamingProvider = ReturnType<typeof createStreamingProvider>;
