import { Injectable } from '@nestjs/common';

@Injectable()
export class DatetimeTool {
  /**
   * Returns the current ISO timestamp.
   */
  run(): string {
    return new Date().toISOString();
  }
}
