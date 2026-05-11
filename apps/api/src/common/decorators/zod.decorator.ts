import { Body, Param, Query } from '@nestjs/common';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Decorator factories that bind a Zod schema to the body/query/param.
 * The return type is inferred from the schema, so controllers get a fully
 * typed argument with zero `any`.
 */

export const ZodBody = <T extends ZodTypeAny>(schema: T): ParameterDecorator =>
  Body(new ZodValidationPipe(schema)) as ParameterDecorator;

export const ZodQuery = <T extends ZodTypeAny>(schema: T): ParameterDecorator =>
  Query(new ZodValidationPipe(schema)) as ParameterDecorator;

export const ZodParam = <T extends ZodTypeAny>(name: string, schema: T): ParameterDecorator =>
  Param(name, new ZodValidationPipe(schema)) as ParameterDecorator;

export type ZodInferred<T extends ZodTypeAny> = ZodInfer<T>;
