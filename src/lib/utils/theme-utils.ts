export function getCSSVariable(name: string): string {
    if (typeof document === 'undefined') return '';  // SSR safety
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}
