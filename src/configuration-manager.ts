// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Configuration = {};

let configuration: Configuration | undefined = undefined;

export const loadConfig = (newConfiguration: Configuration) => {
  configuration = newConfiguration;
};

export const getConfig = (): Configuration => {
  if (!configuration) {
    throw new Error('Configuration is missing. Use loadConfiguration to load the configuration.');
  }

  return configuration;
};
