/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as z from 'zod';

type RequiredConfigurationKeys<T extends z.ZodRawShape> = {
  [K in keyof T]: T[K] extends z.ZodDefault<any> ? never : undefined extends z.infer<T[K]> ? never : K;
}[keyof T];

type ConfigurationProperties<T extends z.ZodRawShape> = {
  [K in keyof T as T[K] extends z.ZodDefault<any> ? K : undefined extends z.infer<T[K]> ? K : never]?: z.infer<T[K]>;
} & {
  [K in keyof T as T[K] extends z.ZodDefault<any> ? never : undefined extends z.infer<T[K]> ? never : K]: z.infer<T[K]>;
};

export type ConfigurationFrom<T extends z.ZodRawShape> = [RequiredConfigurationKeys<T>] extends [never]
  ? {
      configuration?: ConfigurationProperties<T>;
    }
  : {
      configuration: ConfigurationProperties<T>;
    };
