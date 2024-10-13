import { HttpException, HttpStatus } from "@nestjs/common";

export const returnErrorResponse = (message, statusCode = HttpStatus.BAD_REQUEST) => {
  throw new HttpException(message, statusCode)
}

export const successResponse = (data,status = HttpStatus.OK) => {
  return {
    data: typeof data == 'string' ? {message: data} : data,
    status:status,
    success:true
  }
}
