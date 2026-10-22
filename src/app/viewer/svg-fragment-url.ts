/**
 * Build a `url(...)` reference to an SVG fragment that survives `<base href>`.
 * Bare `url(#id)` resolves against the document base and misses in-document ids.
 */
export function svgFragmentUrl(
  id: string,
  pageUrl: string = typeof globalThis.location === 'undefined'
    ? ''
    : globalThis.location.href,
): string {
  const base = pageUrl.split('#')[0] ?? '';
  return `url(${base}#${id})`;
}
