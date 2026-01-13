
export type Color = string;

export interface TubeState {
  id: number;
  layers: Color[];
}

export interface LevelDefinition {
  id: number;
  tubes: Color[][];
  capacity: number;
}

export interface Settings {
  sound: boolean;
  vibration: boolean;
  theme: 'neon' | 'pastel' | 'vibrant';
}

export enum GameState {
  HOME,
  PLAYING,
  LEVEL_COMPLETE,
  SETTINGS,
  LEVEL_SELECT
}
