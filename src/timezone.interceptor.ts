import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';
import * as moment from 'moment-timezone';

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => this.convertDatesToLima(data)),
    );
  }

  private convertDatesToLima(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (obj instanceof Date) {
      return moment(obj)
        .tz('America/Lima')
        .format('YYYY-MM-DD HH:mm:ss');
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertDatesToLima(item));
    }

    if (typeof obj === 'object') {
      const newObj = {};
      for (const key in obj) {
        newObj[key] = this.convertDatesToLima(obj[key]);
      }
      return newObj;
    }

    return obj;
  }
}
