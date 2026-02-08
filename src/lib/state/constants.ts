import { getCSSVariable } from '$lib/utils/theme-utils';
import type { ColorKey } from '$lib/types';

export const ZOOM_CONSTRAINTS = {
    MIN_SCALE: 0.1,
    MAX_SCALE: 5
} as const;

export const NOTE_SIZE = {
  MIN_WIDTH: 120,
  MIN_HEIGHT: 120,
  DEFAULT_WIDTH: 300,  // Match your Rails default
  DEFAULT_HEIGHT: 150   // Match your Rails default
} as const;

export const INTERACTION = {
  CLICK_THRESHOLD: 1,
  RESIZE_ZOOM_THRESHOLD: 0.6,
  MIDDLE_MOUSE: {
    MAX_SPEED: 60,
    DEAD_ZONE: 5,
    MAX_DISTANCE: 300
  },
  AUTO_PAN: {
    EDGE_SIZE: 10,
    MAX_SPEED: 15,
    MIN_SPEED: 1
  }
} as const;

export const COLORS = {
  NOTE_BORDER: getCSSVariable('--color-primary-disabled'),
  SELECTION: getCSSVariable('--color-primary'),
  GRID: getCSSVariable('--color-primary-disabled'),
  SELECTION_FILL: 'rgba(0, 122, 204, 0.1)'
} as const;

export const BORDER = {
  TARGET_PX: 1.2,
  TARGET_SELECTED_PX: 2.4,
  BASE_PX: 1,
  BASE_SELECTED_PX: 2
} as const;

export const GRID = {
  BASE_SIZE: 20,
  ZOOM_LEVELS: [0.125, 0.25, 0.5, 1, 2, 4, 8, 16],
  SIZES: [160, 80, 40, 20, 20, 20, 10, 5]
} as const;

export const RESIZE_HANDLE = {
  SCALE_BREAKPOINT: 0.75,  // Below this scale, use large handle
  SMALL_SIZE: 10,
  LARGE_SIZE: 16
} as const;

export const AUTO_PAN = {
  EDGE_SIZE: 10,    // Thickness of the edge zone in px
  MAX_SPEED: 15,    // px per frame at the very edge
  MIN_SPEED: 1      // px per frame when just outsize edge
} as const;

export const COLOR_PALETTES = {
  light: {
    default: { name: 'Default', value: getCSSVariable('--color-theme-light-default') },  // White
    yellow: { name: 'Yellow', value: getCSSVariable('--color-theme-light-yellow') },
    orange: { name: 'Orange', value: getCSSVariable('--color-theme-light-orange') },
    red: { name: 'Red', value: getCSSVariable('--color-theme-light-red') },
    pink: { name: 'Pink', value: getCSSVariable('--color-theme-light-pink') },
    purple: { name: 'Purple', value: getCSSVariable('--color-theme-light-purple') },
    blue: { name: 'Blue', value: getCSSVariable('--color-theme-light-blue') },
    cyan: { name: 'Cyan', value: getCSSVariable('--color-theme-light-cyan') },
    green: { name: 'Green', value: getCSSVariable('--color-theme-light-green') },
    gray: { name: 'Gray', value: getCSSVariable('--color-theme-light-gray') },
  },
  dark: {
    default: { name: 'Default', value: getCSSVariable('--color-theme-dark-default') },  // Black
    yellow: { name: 'Yellow', value: getCSSVariable('--color-theme-dark-yellow') },
    orange: { name: 'Orange', value: getCSSVariable('--color-theme-dark-orange') },
    red: { name: 'Red', value: getCSSVariable('--color-theme-dark-red') },
    pink: { name: 'Pink', value: getCSSVariable('--color-theme-dark-pink') },
    purple: { name: 'Purple', value: getCSSVariable('--color-theme-dark-purple') },
    blue: { name: 'Blue', value: getCSSVariable('--color-theme-dark-blue') },
    cyan: { name: 'Cyan', value: getCSSVariable('--color-theme-dark-cyan') },
    green: { name: 'Green', value: getCSSVariable('--color-theme-dark-green') },
    gray: { name: 'Gray', value: getCSSVariable('--color-theme-dark-gray') },
  }
} as const;

// For iterating in UI (color picker), maintain display order
export const COLOR_KEYS: ColorKey[] = [
  'default',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'blue',
  'cyan',
  'green',
  'gray'
]

export function getColorPalette(theme: 'light' | 'dark' = 'light') {
  return COLOR_PALETTES[theme];
}
