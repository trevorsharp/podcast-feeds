import { readdir, realpath } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';

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

  let contentRoot: string;
  try {
    await readdir(config.contentFolder);
    contentRoot = await realpath(config.contentFolder);
  } catch {
    throw new Error(`contentFolder (${config.contentFolder}) does not exist`);
  }

  const getContentFilePath = (contentId: string) => {
    const fileName = config.getContentFileName(contentId);

    if (!fileName || fileName.includes('\0')) {
      return undefined;
    }

    const filePath = resolve(contentRoot, fileName);

    if (dirname(filePath) !== contentRoot || basename(filePath) !== fileName) {
      return undefined;
    }

    return filePath;
  };

  const getContent = async (contentId: string) => {
    const filePath = getContentFilePath(contentId);

    if (!filePath) {
      return undefined;
    }

    const contentFile = Bun.file(filePath);

    const fileExists = await contentFile.exists();

    return fileExists ? { fileName: basename(filePath), filePath } : undefined;
  };

  return { ...config, getContentFilePath, getContent };
};

export type ContentManager = Awaited<ReturnType<typeof createContentManager>>;
