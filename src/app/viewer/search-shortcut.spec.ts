import { describe, expect, it } from 'vitest';
import { shouldHandleSearchShortcut } from './search-shortcut';

function event(partial: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  target?: EventTarget | null;
}): {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  target: EventTarget | null;
} {
  return {
    ctrlKey: false,
    metaKey: false,
    target: null,
    ...partial,
  };
}

describe('shouldHandleSearchShortcut', () => {
  it('handles / and Ctrl/Meta+K when focus is not in a text field', () => {
    expect(shouldHandleSearchShortcut(event({ key: '/' }))).toBe(true);
    expect(shouldHandleSearchShortcut(event({ key: 'k', ctrlKey: true }))).toBe(
      true,
    );
    expect(shouldHandleSearchShortcut(event({ key: 'K', metaKey: true }))).toBe(
      true,
    );
  });

  it('ignores shortcuts while typing in an input, textarea, or contenteditable', () => {
    const input = { tagName: 'INPUT' } as unknown as EventTarget;
    const textarea = { tagName: 'TEXTAREA' } as unknown as EventTarget;
    const editable = {
      tagName: 'DIV',
      isContentEditable: true,
    } as unknown as EventTarget;

    expect(shouldHandleSearchShortcut(event({ key: '/', target: input }))).toBe(
      false,
    );
    expect(
      shouldHandleSearchShortcut(event({ key: 'k', ctrlKey: true, target: textarea })),
    ).toBe(false);
    expect(
      shouldHandleSearchShortcut(event({ key: '/', target: editable })),
    ).toBe(false);
  });

  it('ignores unrelated keys', () => {
    expect(shouldHandleSearchShortcut(event({ key: 'Escape' }))).toBe(false);
    expect(shouldHandleSearchShortcut(event({ key: 'k' }))).toBe(false);
  });
});
