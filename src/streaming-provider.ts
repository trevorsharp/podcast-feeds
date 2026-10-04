import * as z from 'zod';

import { withCache } from './utilities/cache';
import type { PartialShape } from './utilities/zod';

export const streamingProviderConfigurationSchema = z.object({
  cacheStreamingUrlTimeToLive: z.number().default(0),
});

type Configuration = PartialShape<typeof streamingProviderConfigurationSchema.shape>;

type CreateStreamingProviderOptions = {
  configuration: Configuration;
  fetchStreamingUrl: (contentId: string) => Promise<string>;
};

export const createStreamingProvider = ({ configuration, fetchStreamingUrl }: CreateStreamingProviderOptions) => {
  const config = streamingProviderConfigurationSchema.parse(configuration);

  const getStreamingUrl = withCache(
    {
      cacheKey: 'streaming-url',
      timeToLive: config.cacheStreamingUrlTimeToLive,
    },
    fetchStreamingUrl,
  );

  return { getStreamingUrl };
};

export type StreamingProvider = ReturnType<typeof createStreamingProvider>;
