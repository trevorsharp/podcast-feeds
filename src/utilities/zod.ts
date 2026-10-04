/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as z from 'zod';

export type PartialShape<T extends z.ZodRawShape> = {
  [K in keyof T as T[K] extends z.ZodDefault<any> ? K : undefined extends z.infer<T[K]> ? K : never]?: z.infer<T[K]>;
} & {
  [K in keyof T as T[K] extends z.ZodDefault<any> ? never : undefined extends z.infer<T[K]> ? never : K]: z.infer<T[K]>;
};
