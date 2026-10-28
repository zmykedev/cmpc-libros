import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

/** Envuelve todas las respuestas JSON en un formato uniforme { success, data, timestamp }. */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | StreamableFile> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | StreamableFile> {
    return next.handle().pipe(
      map((data) =>
        data instanceof StreamableFile ? data : { success: true as const, data, timestamp: new Date().toISOString() },
      ),
    );
  }
}
