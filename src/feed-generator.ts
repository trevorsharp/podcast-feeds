import { Podcast } from 'podcast';
import * as z from 'zod';

import type { BaseDownloadOptions, DownloadManager } from './download-manager';
import type { BaseFeedOptions, FeedDataProvider } from './feed-data-provider';

export const feedGeneratorConfigurationSchema = z.object({
  downloadLatestNumberOfItems: z.number().min(0).default(0),
});

export type FeedGeneratorConfiguration = z.infer<typeof feedGeneratorConfigurationSchema>;

export const createFeedGenerator = <
  TFeedDataOptions extends BaseFeedOptions = BaseFeedOptions,
  TDownloadOptions extends BaseDownloadOptions = BaseDownloadOptions,
>(
  configuration: unknown,
  feedDataProvider: FeedDataProvider<TFeedDataOptions>,
  downloadManager?: DownloadManager<TDownloadOptions>,
  mapFeedOptionsToDownloadOptions?: (feedOptions: TFeedDataOptions) => TDownloadOptions | undefined,
) => {
  const config = feedGeneratorConfigurationSchema.parse(configuration);

  const generatePodcastFeed = async (feedId: string, options: TFeedDataOptions) => {
    const feedData = await feedDataProvider.getFeedDataWithContent(feedId, options);

    const { downloadLatestNumberOfItems } = config;

    if (downloadLatestNumberOfItems) {
      const downloadOptions = mapFeedOptionsToDownloadOptions?.(options);

      feedData.content
        .filter((_, index) => index < downloadLatestNumberOfItems)
        .forEach(({ contentId }) => downloadManager?.addToDownloadQueue(contentId, downloadOptions));
    }

    const rssFeed = new Podcast({
      title: feedData.title,
      description: feedData.description,
      author: feedData.title,
      feedUrl: feedData.feedUrl,
      siteUrl: feedData.sourceUrl,
      imageUrl: feedData.imageUrl,
    });

    feedData.content.forEach((content) =>
      rssFeed.addItem({
        title: content.title,
        itunesTitle: content.title,
        description: content.description,
        date: content.date,
        itunesDuration: content.duration,
        url: content.sourceUrl,
        itunesImage: content.imageUrl,
        enclosure: {
          url: content.contentUrl,
          type: content.mimeType === 'application/x-mpegURL' ? 'video/mp4' : content.mimeType,
        },
        customElements:
          content.mimeType === 'application/x-mpegURL'
            ? [
                {
                  'podcast:alternateEnclosure': [
                    { _attr: { type: 'application/x-mpegURL', length: 0 } },
                    { 'podcast:source': { _attr: { uri: content.contentUrl } } },
                  ],
                },
              ]
            : [],
      }),
    );

    return rssFeed.buildXml();
  };

  return { generatePodcastFeed };
};

export type FeedGenerator<
  TFeedDataOptions extends BaseFeedOptions = BaseFeedOptions,
  TDownloadOptions extends BaseDownloadOptions = BaseDownloadOptions,
> = ReturnType<typeof createFeedGenerator<TFeedDataOptions, TDownloadOptions>>;
