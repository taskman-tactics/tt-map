export type SearchShortcutEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  target: EventTarget | null;
};

/** Whether `/` or Ctrl/Meta+K should focus Viewer search (not while typing elsewhere). */
export function shouldHandleSearchShortcut(
  event: SearchShortcutEvent,
): boolean {
  if (isTypingTarget(event.target)) {
    return false;
  }
  if (event.key === '/') {
    return true;
  }
  const key = event.key.toLowerCase();
  return key === 'k' && (event.ctrlKey || event.metaKey);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (target == null || typeof target !== 'object') {
    return false;
  }
  const el = target as {
    tagName?: string;
    isContentEditable?: boolean;
  };
  const tag = el.tagName?.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return el.isContentEditable === true;
}
