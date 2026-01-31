const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

export const primaryModifierKey: 'Meta' | 'Control' = isMac ? 'Meta' : 'Control';

export const primaryModifierFlag: 'metaKey' | 'ctrlKey' = isMac ? 'metaKey' : 'ctrlKey';
