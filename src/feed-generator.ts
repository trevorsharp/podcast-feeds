import { Podcast } from 'podcast';
import * as z from 'zod';

import type { DownloadManager } from './download-manager';
import type { FeedDataProvider } from './feed-data-provider';

export const feedGeneratorConfigurationSchema = z.object({
  downloadLatestNumberOfItems: z.number().min(0).default(0),
});

export type FeedGeneratorConfiguration = z.infer<typeof feedGeneratorConfigurationSchema>;

export const createFeedGenerator = <
  TFeedDataOptions extends { baseUrl: string } = { baseUrl: string },
  TDownloadOptions extends object | undefined = undefined,
>(
  config: FeedGeneratorConfiguration,
  feedDataProvider: FeedDataProvider<TFeedDataOptions>,
  downloadManager?: DownloadManager<TDownloadOptions>,
  mapFeedOptionsToDownloadOptions?: (feedOptions: TFeedDataOptions) => TDownloadOptions | undefined,
) => {
  const generatePodcastFeed = async (feedId: string, options: TFeedDataOptions) => {
    const feedData = await feedDataProvider.getFeedDataWithContent(feedId, options);

    const { downloadLatestNumberOfItems } = config;

    if (downloadLatestNumberOfItems) {
      const downloadOptions = mapFeedOptionsToDownloadOptions ? mapFeedOptionsToDownloadOptions(options) : undefined;

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
  TFeedDataOptions extends { baseUrl: string } = { baseUrl: string },
  TDownloadOptions extends object | undefined = undefined,
> = ReturnType<typeof createFeedGenerator<TFeedDataOptions, TDownloadOptions>>;
