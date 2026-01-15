import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/features/users/entities/user.entity';

export const CompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request: {user: User} = ctx.switchToHttp().getRequest();
    return request.user.companyId;
  },
);