import { describe, expect, it } from 'vitest';
import { formatDuration, kebabCase } from './format';

describe('kebabCase', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(kebabCase('Hello World')).toBe('hello-world');
    expect(kebabCase('Multiple   Spaces')).toBe('multiple-spaces');
  });

  it('handles empty string', () => {
    expect(kebabCase('')).toBe('');
  });
});

describe('formatDuration', () => {
  it('formats seconds-only durations', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes + seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats hours + minutes + seconds', () => {
    expect(formatDuration(3725)).toBe('1h 2m 5s');
  });
});
