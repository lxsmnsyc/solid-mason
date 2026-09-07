import { describe, expect, it } from 'vitest';
import {
  createMasonState,
  getContentWidth,
  getLongestColumn,
  getShortestColumn,
} from '../src/layout';

describe('getShortestColumn', () => {
  it('returns the index of the smallest value', () => {
    expect(getShortestColumn([30, 10, 20])).toBe(1);
  });

  it('returns the first of several equal minimums', () => {
    expect(getShortestColumn([10, 10, 10])).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(getShortestColumn([])).toBe(0);
  });
});

describe('getLongestColumn', () => {
  it('returns the index of the largest value', () => {
    expect(getLongestColumn([30, 10, 20])).toBe(0);
  });

  it('returns the first of several equal maximums', () => {
    expect(getLongestColumn([10, 10, 10])).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(getLongestColumn([])).toBe(0);
  });
});

describe('createMasonState', () => {
  it('starts every column at zero height', () => {
    expect(createMasonState(3).columns).toEqual([0, 0, 0]);
  });

  it('clamps column counts below one', () => {
    expect(createMasonState(0).columns).toEqual([0]);
    expect(createMasonState(-5).columns).toEqual([0]);
  });
});

describe('getContentWidth', () => {
  it('subtracts horizontal padding from the client width', () => {
    const el = document.createElement('div');
    el.style.width = '200px';
    el.style.padding = '0 20px';
    el.style.boxSizing = 'content-box';
    document.body.append(el);

    try {
      // 200px of content plus 20px of padding on each side, minus that padding.
      expect(getContentWidth(el)).toBe(200);
    } finally {
      el.remove();
    }
  });
});
