import { readdir } from 'node:fs/promises';

export const folderExists = async (folderPath: string) => {
  try {
    await readdir(folderPath);
    return true;
  } catch {
    return false;
  }
};
