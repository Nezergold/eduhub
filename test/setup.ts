import { vi } from "vitest";

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Mock window.dispatchEvent for CustomEvents
const eventListeners: Record<string, EventListener[]> = {};
const originalAddEventListener = globalThis.addEventListener;
const originalRemoveEventListener = globalThis.removeEventListener;

Object.defineProperty(globalThis, "addEventListener", {
  value: vi.fn((type: string, listener: EventListener) => {
    if (!eventListeners[type]) eventListeners[type] = [];
    eventListeners[type].push(listener);
  }),
});

Object.defineProperty(globalThis, "removeEventListener", {
  value: vi.fn((type: string, listener: EventListener) => {
    if (eventListeners[type]) {
      eventListeners[type] = eventListeners[type].filter(l => l !== listener);
    }
  }),
});

// Mock window.dispatchEvent to capture CustomEvents
const originalDispatch = globalThis.dispatchEvent.bind(globalThis);
Object.defineProperty(globalThis, "dispatchEvent", {
  value: vi.fn((event: Event) => {
    if (event.type && eventListeners[event.type]) {
      eventListeners[event.type].forEach(l => l(event));
    }
    return true;
  }),
});

// Mock crypto.subtle.digest for password hashing
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      subtle: {
        digest: vi.fn(async (_algo: string, data: ArrayBuffer) => {
          // Simple hash for testing
          const bytes = new Uint8Array(data);
          let hash = 0;
          for (let i = 0; i < bytes.length; i++) {
            hash = ((hash << 5) - hash + bytes[i]) | 0;
          }
          const result = new Uint8Array(32);
          const view = new DataView(result.buffer);
          view.setInt32(0, hash);
          return result;
        }),
      },
      getRandomValues: vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
      }),
    },
  });
}

// Reset store between tests
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  Object.keys(eventListeners).forEach(k => { eventListeners[k] = []; });
});
