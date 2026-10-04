import { readdir } from 'node:fs/promises';

import * as z from 'zod';

import type { PartialShape } from './utilities/zod';

const folderPathRegex = /^(?!.*\/$).+$/;

export const contentManagerConfigurationSchema = z.object({
  contentFolder: z.string().regex(folderPathRegex).default('./content'),
  getContentFileName: z.function({ input: [z.string()], output: z.string() }),
});

type Configuration = PartialShape<typeof contentManagerConfigurationSchema.shape>;

type createContentManagerOptions = { configuration: Configuration };

export const createContentManager = async ({ configuration }: createContentManagerOptions) => {
  const config = contentManagerConfigurationSchema.parse(configuration);

  if (config.contentFolder) {
    try {
      await readdir(config.contentFolder);
    } catch {
      throw new Error(`contentFolder (${config.contentFolder}) does not exist`);
    }
  }

  const getContent = async (contentId: string) => {
    const fileName = config.getContentFileName(contentId);
    const filePath = `${config.contentFolder}/${fileName}`;
    const contentFile = Bun.file(filePath);

    const fileExists = await contentFile.exists();

    return fileExists ? { fileName, filePath } : undefined;
  };

  return { ...config, getContent };
};

export type ContentManager = Awaited<ReturnType<typeof createContentManager>>;
