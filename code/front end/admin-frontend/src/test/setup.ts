import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

import { vi } from 'vitest';

afterEach(() => {
  cleanup();
});

class MockIntersectionObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
  takeRecords() { return []; }
  root = null;
  rootMargin = '';
  scrollMargin = '';
  thresholds = [];
}

// Mock IntersectionObserver
globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = ((() => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
}) as unknown as CanvasRenderingContext2D) as unknown) as typeof HTMLCanvasElement.prototype.getContext;

// Mock MUI icons to prevent EMFILE
vi.mock('@mui/icons-material', () => ({
  Visibility: () => 'VisibilityIcon',
  VisibilityOff: () => 'VisibilityOffIcon',
}));
