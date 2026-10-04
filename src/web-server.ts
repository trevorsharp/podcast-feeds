import { Hono } from 'hono';
import z from 'zod';

import type { ContentServer } from './content-server';
import type { FeedGenerator } from './feed-generator';

const urlPathRegex = /^\/(?:[^/]+(?:\/[^/]+)*)?$/;

export const webServerConfigurationSchema = z
  .object({
    contentApiPath: z.string().regex(urlPathRegex),
    contentServerPath: z.string().regex(urlPathRegex).default('/content'),
  })
  .refine(({ contentApiPath, contentServerPath }) => contentApiPath.toLowerCase() !== contentServerPath.toLowerCase(), {
    error: 'contentApiPath cannot be the same as contentServerPath',
  });

export type WebServerConfiguration = z.infer<typeof webServerConfigurationSchema>;

export const createWebServer = ({
  configuration,
  feedGenerator,
  contentServer,
}: {
  configuration: Partial<WebServerConfiguration>;
  feedGenerator: FeedGenerator;
  contentServer: ContentServer;
}) => {
  const config = webServerConfigurationSchema.parse(configuration ?? {});

  const webServer = new Hono();

  webServer.get('/:feedId/feed', async (context) => {
    const { feedId } = context.req.param();
    const host = context.req.header('host') ?? '';
    const isHttps = context.req.header('x-forwarded-proto') === 'https';
    const baseUrl = `${isHttps ? 'https' : 'http'}://${host}`;

    const podcastFeed = await feedGenerator.generatePodcastFeed(feedId, { baseUrl });

    return context.text(podcastFeed, 200, { 'Content-Type': 'application/rss+xml' });
  });

  webServer.get(`${config.contentApiPath}/:contentId`, async (context) => {
    const { contentId } = context.req.param();

    const content = await contentServer.getContent(contentId);

    if (content?.redirectUrl) {
      return context.redirect(content.redirectUrl, 302);
    }

    if (content?.fileName) {
      return context.redirect(`${config.contentServerPath}/${content.fileName}`, 302);
    }

    return context.text('Content is not available', 503, { 'Retry-After': '30' });
  });

  return webServer;
};

export type WebServer = ReturnType<typeof createWebServer>;
