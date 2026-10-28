import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Normaliza todos los errores a { success:false, statusCode, message, path, timestamp }. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const { status, message } = this.resolve(exception);

    if (status >= 500) this.logger.error(exception instanceof Error ? exception.stack : String(exception));

    res.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }

  resolve(exception: unknown): { status: number; message: string | string[] } {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const message = typeof body === 'string' ? body : ((body as { message?: string | string[] }).message ?? exception.message);
      return { status: exception.getStatus(), message };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') return { status: HttpStatus.NOT_FOUND, message: 'Recurso no encontrado' };
      if (exception.code === 'P2002') return { status: HttpStatus.CONFLICT, message: 'El registro ya existe' };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error interno del servidor' };
  }
}
