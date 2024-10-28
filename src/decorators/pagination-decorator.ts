import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class PaginationDto {
  offset: number;
  limit: number;
}



export const GetPagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const response = new PaginationDto();
    response.limit = Number(request.query.limit)
        ? Number(request.query.limit) > 100
            ? 100
            : Number(request.query.limit)
        : 20;
    response.offset = Number(request.query.page)
        ? Number(request.query.page) > 0
            ? (Number(request.query.page) - 1) * response.limit
            : 0
        : 0;
    return response;
  },
);
