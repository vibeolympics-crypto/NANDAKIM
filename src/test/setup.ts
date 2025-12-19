import '@testing-library/jest-dom';

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock HTMLMediaElement methods for audio/video tests
// jsdom doesn't implement these methods, so we need to mock them
window.HTMLMediaElement.prototype.load = () => {
  // Mock implementation - do nothing
};

window.HTMLMediaElement.prototype.play = () => {
  // Mock implementation - return a resolved promise
  return Promise.resolve();
};

window.HTMLMediaElement.prototype.pause = () => {
  // Mock implementation - do nothing
};

// Mock HTMLMediaElement properties
Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
  get() {
    return 180; // Default 3 minutes
  },
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
  get() {
    return 0;
  },
  set() {
    // Mock setter - do nothing
  },
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'volume', {
  get() {
    return 1;
  },
  set() {
    // Mock setter - do nothing
  },
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'muted', {
  get() {
    return false;
  },
  set() {
    // Mock setter - do nothing
  },
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'paused', {
  get() {
    return true;
  },
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'ended', {
  get() {
    return false;
  },
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'readyState', {
  get() {
    return 4; // HAVE_ENOUGH_DATA
  },
});
