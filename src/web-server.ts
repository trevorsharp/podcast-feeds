import { Hono } from 'hono';
import z from 'zod';

import type { ContentServer } from './content-server';
import type { FeedGenerator } from './feed-generator';
import type { ConfigurationFrom } from './utilities/zod';

const urlPathPartSchema = z.string().regex(/^$|^\/[^/].*[^/]$/);

const webServerConfigurationSchema = z.object({
  feedApiRoute: z.templateLiteral([urlPathPartSchema, '/:feedId', urlPathPartSchema]).default('/:feedId/feed'),
  contentApiRoute: z.templateLiteral([urlPathPartSchema, '/:contentId', urlPathPartSchema]),
});

type CreateWebServerOptions = ConfigurationFrom<typeof webServerConfigurationSchema.shape> & {
  feedGenerator: FeedGenerator;
  contentServer: ContentServer;
};

export const createWebServer = ({ configuration, feedGenerator, contentServer }: CreateWebServerOptions) => {
  const config = webServerConfigurationSchema.parse(configuration ?? {});

  const webServer = new Hono();

  webServer.get(config.feedApiRoute, async (context) => {
    const feedId = context.req.param('feedId');
    const host = context.req.header('host') ?? '';
    const isHttps = context.req.header('x-forwarded-proto') === 'https';
    const baseUrl = `${isHttps ? 'https' : 'http'}://${host}`;

    const podcastFeed = await feedGenerator.generatePodcastFeed(feedId, { baseUrl });

    if (!podcastFeed) {
      return context.text('Could not generate podcast feed', 500);
    }

    return context.text(podcastFeed, 200, { 'Content-Type': 'application/rss+xml' });
  });

  webServer.get(config.contentApiRoute, async (context) => {
    const contentId = context.req.param('contentId');

    const contentUrl = await contentServer.getContentUrl(contentId);

    if (contentUrl) {
      return context.redirect(contentUrl, 302);
    }

    return context.text('Content is not available', 503, { 'Retry-After': '30' });
  });

  return webServer;
};

export type WebServer = ReturnType<typeof createWebServer>;
