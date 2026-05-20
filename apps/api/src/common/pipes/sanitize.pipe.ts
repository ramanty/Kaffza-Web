import { Injectable, PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    return this.sanitize(value);
  }

  private sanitize(obj: any): any {
    if (typeof obj === 'string') {
      // C-07: Sanitize string inputs to prevent Stored XSS
      return sanitizeHtml(obj, {
        allowedTags: [], // strip all tags
        allowedAttributes: {},
      });
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitizedObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitizedObj[key] = this.sanitize(obj[key]);
        }
      }
      return sanitizedObj;
    }

    return obj;
  }
}
