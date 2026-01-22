import { getCSSVariable } from '$lib/utils/theme-utils';

export const ZOOM_CONSTRAINTS = {
    MIN_SCALE: 0.1,
    MAX_SCALE: 5
} as const;

export const NOTE_SIZE = {
  MIN_WIDTH: 50,
  MIN_HEIGHT: 30,
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
