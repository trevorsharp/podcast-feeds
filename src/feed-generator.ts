import { Podcast } from 'podcast';

import type { FeedDataProvider } from './feed-data-provider';
import { mimeTypes } from './utilities/mimeTypes';

type CreateFeedGeneratorOptions = { feedDataProvider: FeedDataProvider };

export const createFeedGenerator = ({ feedDataProvider }: CreateFeedGeneratorOptions) => {
  const generatePodcastFeed = async (feedId: string, options: { baseUrl: string }) => {
    const feedData = await feedDataProvider.getFeedDataWithContent(feedId, options);

    if (!feedData) {
      return undefined;
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
          type: mimeTypes[content.contentType],
        },
        customElements:
          content.contentType === 'HLS'
            ? [
                {
                  'podcast:alternateEnclosure': [
                    { _attr: { type: mimeTypes.HLS_ALTERNATE, length: 0 } },
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

export type FeedGenerator = ReturnType<typeof createFeedGenerator>;
