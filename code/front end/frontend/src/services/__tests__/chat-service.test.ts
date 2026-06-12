import { describe, it, expect, vi, beforeEach } from 'vitest';
import chatApi from '../chat-service';

vi.mock('../../store/auth-store', () => {
  return {
    default: {
      getState: () => ({ token: 'mock-token' }),
    },
  };
});

describe('chatApi.streamMessage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls lazy stream endpoint when sessionId is null', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        body: {
          getReader() {
            return {
              async read() {
                return { done: true, value: new Uint8Array() };
              },
            };
          },
        },
      } as any;
    });

    const onEvent = vi.fn();
    await chatApi.streamMessage(null, 'Hello', 'turn-123', onEvent);

    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/v1/chat/messages/stream');
  });

  it('calls existing stream endpoint when sessionId is present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        body: {
          getReader() {
            return {
              async read() {
                return { done: true, value: new Uint8Array() };
              },
            };
          },
        },
      } as any;
    });

    const onEvent = vi.fn();
    await chatApi.streamMessage(456, 'Hello', 'turn-123', onEvent);

    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/v1/chat/sessions/456/messages/stream');
  });
});
