import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/**
 * Turns the two Prisma errors this API can actually produce into HTTP status
 * codes: a missing record (including a failed relation `connect`) is a 404, a
 * unique violation is a 409. Anything else falls through to the default 500.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  override catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const mapped = this.toHttpException(exception);
    super.catch(mapped ?? exception, host);
  }

  private toHttpException(
    exception: Prisma.PrismaClientKnownRequestError,
  ): HttpException | undefined {
    switch (exception.code) {
      case 'P2025':
        return new NotFoundException(
          typeof exception.meta?.cause === 'string'
            ? exception.meta.cause
            : 'Record not found',
        );
      case 'P2003':
        return new NotFoundException('Related record not found');
      case 'P2002':
        return new ConflictException('Record already exists');
      default:
        return undefined;
    }
  }
}
