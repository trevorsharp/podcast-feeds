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
  contentType: 'MP4' | 'HLS' | 'MP3';
  sourceUrl: string;
  imageUrl?: string;
};

export type FeedDataWithContent = FeedData & { content: FeedContent[] };
