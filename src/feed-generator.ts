import { Podcast } from 'podcast';

import type { FeedDataProvider } from './feed-data-provider';

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
          type: content.contentType === 'MP3' ? 'audio/mp3' : 'video/mp4',
        },
        customElements:
          content.contentType === 'HLS'
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

export type FeedGenerator = ReturnType<typeof createFeedGenerator>;
