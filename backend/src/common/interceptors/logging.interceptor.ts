import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

/** Loguea método, ruta, usuario y duración de cada request. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const start = Date.now();
    const user = req.user?.email ?? 'anon';
    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${req.method} ${req.url} ${user} ${Date.now() - start}ms`),
        error: (err) => this.logger.warn(`${req.method} ${req.url} ${user} ${Date.now() - start}ms -> ${err?.message}`),
      }),
    );
  }
}
