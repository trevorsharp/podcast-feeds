import * as z from 'zod';

import { withCache } from './utilities/cache';

export const streamingProviderConfigurationSchema = z.object({
  cacheStreamingUrlTimeToLive: z.number().default(0),
});

export type StreamingProviderConfiguration = z.infer<typeof streamingProviderConfigurationSchema>;

export const createStreamingProvider = ({
  configuration,
  fetchStreamingUrl,
}: {
  configuration?: Partial<StreamingProviderConfiguration> | undefined;
  fetchStreamingUrl: (contentId: string) => Promise<string>;
}) => {
  const config = streamingProviderConfigurationSchema.parse(configuration ?? {});

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
