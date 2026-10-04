import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import * as z from 'zod';

import type { ConfigurationFrom } from './utilities/zod';

const folderPathRegex = /^(?!.*\/$).+$/;

export const contentManagerConfigurationSchema = z.object({
  contentFolder: z.string().regex(folderPathRegex).default('./content'),
  getContentFileName: z.function({ input: [z.string()], output: z.string() }),
});

type createContentManagerOptions = ConfigurationFrom<typeof contentManagerConfigurationSchema.shape>;

export const createContentManager = async ({ configuration }: createContentManagerOptions) => {
  const config = contentManagerConfigurationSchema.parse(configuration ?? {});

  if (config.contentFolder) {
    try {
      await readdir(config.contentFolder);
    } catch {
      throw new Error(`contentFolder (${config.contentFolder}) does not exist`);
    }
  }

  const getContentFilePath = (contentId: string) => join(config.contentFolder, config.getContentFileName(contentId));

  const getContent = async (contentId: string) => {
    const fileName = config.getContentFileName(contentId);
    const filePath = getContentFilePath(contentId);
    const contentFile = Bun.file(filePath);

    const fileExists = await contentFile.exists();

    return fileExists ? { fileName, filePath } : undefined;
  };

  return { ...config, getContentFilePath, getContent };
};

export type ContentManager = Awaited<ReturnType<typeof createContentManager>>;
