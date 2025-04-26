import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

// TODO: Implement actual configuration loading (e.g., from .env, config files)
// using NestJS ConfigModule or similar.
@Injectable()
export class ConfigService {
  // Inject the core NestJS ConfigService
  constructor(private nestConfigService: NestConfigService) {}

  get<T = any>(key: string): T | undefined {
    return this.nestConfigService.get<T>(key);
  }

  getNumber(key: string, defaultValue?: number): number | undefined {
    const value = this.get<string | number>(key);
    // Check if value is already a number
    if (typeof value === 'number') {
      return value;
    }
    // Try parsing if it's a string
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        return num;
      }
    }
    // Return default if parsing failed or type was wrong
    return defaultValue;
  }

  getString(key: string, defaultValue?: string): string | undefined {
    // Use the base get method and handle default explicitly
    const value = this.get<string>(key);
    return value ?? defaultValue; // Return value if it exists (and is string), otherwise default
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get<string | boolean>(key);
    if (value === undefined || value === null) {
      return defaultValue;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    // Handle string representations
    return String(value).toLowerCase() === 'true';
  }
}
