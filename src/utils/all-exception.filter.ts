import {Catch, ArgumentsHost, HttpStatus } from "@nestjs/common";
import {Request, Response} from 'express';
import { BaseExceptionFilter } from "@nestjs/core";
const logger = require('./logger');

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const validatorErrors = exception.response ? exception.response.message : null;

    const message = (exception instanceof Error) ? validatorErrors ? validatorErrors : exception.message : exception.message.error ? exception.message.error : response;
    let path = '';
    logger.error(`${status || 500}  ${ message }`);
    if (process.env.NODE_ENV === 'development'){
      console.log(exception);
      path = request.url;
    }
    if (exception.status === HttpStatus.NOT_FOUND) {
      status = HttpStatus.NOT_FOUND;
    }

    if (exception.status === HttpStatus.SERVICE_UNAVAILABLE) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
    }

    if (exception.status === HttpStatus.NOT_ACCEPTABLE) {
      status = HttpStatus.NOT_ACCEPTABLE;
    }

    if (exception.status === HttpStatus.EXPECTATION_FAILED) {
      status = HttpStatus.EXPECTATION_FAILED;
    }

    if (exception.status === HttpStatus.BAD_REQUEST) {
      status = HttpStatus.BAD_REQUEST;
    }

    if (exception.status === HttpStatus.UNAUTHORIZED) {
      status = HttpStatus.UNAUTHORIZED;
    }
    response
      .status(status)
      .json({
        status: status,
        success:false,
        data:[],
        errors:message,
        timestamp: new Date().toISOString(),
        path ,
        message: (status === HttpStatus.INTERNAL_SERVER_ERROR) ? 'Sorry we are experiencing technical problems.' : ''
      });
  }
}
