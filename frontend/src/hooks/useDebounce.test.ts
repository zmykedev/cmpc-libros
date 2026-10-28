import { act, renderHook } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('sólo emite el último valor tras el retardo', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: 'a' } });
    rerender({ v: 'ab' });
    rerender({ v: 'abc' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('abc');
    vi.useRealTimers();
  });
});
