
import { LevelDefinition } from './types';

export const CAPACITY = 4;

export const COLOR_PALETTE = {
  vibrant: {
    cyan: 'linear-gradient(180deg, #22d3ee 0%, #0891b2 100%)',
    magenta: 'linear-gradient(180deg, #f0abfc 0%, #c026d3 100%)',
    lime: 'linear-gradient(180deg, #bef264 0%, #65a30d 100%)',
    amber: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
    violet: 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)',
    emerald: 'linear-gradient(180deg, #34d399 0%, #059669 100%)',
    rose: 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)',
    indigo: 'linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)',
    orange: 'linear-gradient(180deg, #fb923c 0%, #ea580c 100%)',
    teal: 'linear-gradient(180deg, #2dd4bf 0%, #0d9488 100%)'
  },
  pastel: {
    cyan: 'linear-gradient(180deg, #a5f3fc 0%, #86dbe3 100%)',
    magenta: 'linear-gradient(180deg, #f5d0fe 0%, #d8b4fe 100%)',
    lime: 'linear-gradient(180deg, #ecfccb 0%, #d9f99d 100%)',
    amber: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
    violet: 'linear-gradient(180deg, #ede9fe 0%, #ddd6fe 100%)',
    emerald: 'linear-gradient(180deg, #d1fae5 0%, #a7f3d0 100%)',
    rose: 'linear-gradient(180deg, #ffe4e6 0%, #fecdd3 100%)',
    indigo: 'linear-gradient(180deg, #e0e7ff 0%, #c7d2fe 100%)',
    orange: 'linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%)',
    teal: 'linear-gradient(180deg, #ccfbf1 0%, #99f6e4 100%)'
  },
  neon: {
    cyan: 'linear-gradient(180deg, #00ffff 0%, #004444 100%)',
    magenta: 'linear-gradient(180deg, #ff00ff 0%, #440044 100%)',
    lime: 'linear-gradient(180deg, #00ff00 0%, #004400 100%)',
    amber: 'linear-gradient(180deg, #ffff00 0%, #444400 100%)',
    violet: 'linear-gradient(180deg, #bc13fe 0%, #2a043d 100%)',
    emerald: 'linear-gradient(180deg, #00ff88 0%, #004422 100%)',
    rose: 'linear-gradient(180deg, #ff0055 0%, #440016 100%)',
    indigo: 'linear-gradient(180deg, #4444ff 0%, #111144 100%)',
    orange: 'linear-gradient(180deg, #ff9900 0%, #442200 100%)',
    teal: 'linear-gradient(180deg, #00ccff 0%, #003344 100%)'
  }
};

export const generateLevels = (): LevelDefinition[] => {
  const levels: LevelDefinition[] = [];
  const palette = Object.values(COLOR_PALETTE.vibrant);

  for (let i = 1; i <= 100; i++) {
    // Difficulty progression
    // Level 1-5: 3 colors, 2 extra
    // Level 6-15: 4-5 colors, 2-3 extra
    // Level 16+: gradual increase
    const colorCount = Math.min(palette.length, i <= 5 ? 3 : 3 + Math.floor((i - 5) / 5) + 1);
    const extraTubes = i < 15 ? 2 : 3;
    
    const allLayers: string[] = [];
    for (let c = 0; c < colorCount; c++) {
      for (let l = 0; l < 4; l++) {
        allLayers.push(palette[c]);
      }
    }

    // Shuffle layers
    for (let j = allLayers.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allLayers[j], allLayers[k]] = [allLayers[k], allLayers[j]];
    }

    const tubes: string[][] = [];
    for (let c = 0; c < colorCount; c++) {
      tubes.push(allLayers.slice(c * 4, (c + 1) * 4));
    }
    for (let e = 0; e < extraTubes; e++) {
      tubes.push([]);
    }

    levels.push({
      id: i,
      tubes,
      capacity: 4
    });
  }
  return levels;
};
