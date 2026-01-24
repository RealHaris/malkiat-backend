import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const result = this.schema.parse(value);
      return result;
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((err) => {
          const path = err.path.join('.');
          return `${path ? path + ': ' : ''}${err.message}`;
        });
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: messages,
        });
      }
      throw error;
    }
  }
}
