import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // handle http exception
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            return response.status(status).json({
                statusCode: status,
                message: exception.message,
                error: exception.name,
            });
        }

        // handle other exceptions
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: exception.message || 'Internal server error',
            error: exception.name || 'Error'
        });
    }
}