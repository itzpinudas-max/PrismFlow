
import { TubeState } from '../types';

export const canMove = (from: TubeState, to: TubeState, capacity: number): boolean => {
  if (from.layers.length === 0) return false;
  if (to.layers.length >= capacity) return false;
  
  const fromColor = from.layers[from.layers.length - 1];
  const toColor = to.layers.length > 0 ? to.layers[to.layers.length - 1] : null;

  return toColor === null || toColor === fromColor;
};

export const executeMove = (from: TubeState, to: TubeState, capacity: number): { updatedFrom: TubeState, updatedTo: TubeState, movedCount: number } => {
  const newFrom = [...from.layers];
  const newTo = [...to.layers];
  
  const moveColor = newFrom[newFrom.length - 1];
  let count = 0;

  while (
    newFrom.length > 0 && 
    newFrom[newFrom.length - 1] === moveColor && 
    newTo.length < capacity
  ) {
    newTo.push(newFrom.pop()!);
    count++;
  }

  return {
    updatedFrom: { ...from, layers: newFrom },
    updatedTo: { ...to, layers: newTo },
    movedCount: count
  };
};

export const checkWin = (tubes: TubeState[], capacity: number): boolean => {
  return tubes.every(tube => {
    if (tube.layers.length === 0) return true;
    if (tube.layers.length !== capacity) return false;
    const firstColor = tube.layers[0];
    return tube.layers.every(color => color === firstColor);
  });
};

export interface Hint {
  fromIndex: number;
  toIndex: number;
}

export const findBestMove = (tubes: TubeState[], capacity: number): Hint | null => {
  // 1. Look for moves that complete a set
  for (let i = 0; i < tubes.length; i++) {
    for (let j = 0; j < tubes.length; j++) {
      if (i === j) continue;
      if (canMove(tubes[i], tubes[j], capacity)) {
        const moveColor = tubes[i].layers[tubes[i].layers.length - 1];
        // If moving completes the target tube or moves onto a matching color
        if (tubes[j].layers.length > 0 && tubes[j].layers[tubes[j].layers.length - 1] === moveColor) {
           return { fromIndex: i, toIndex: j };
        }
      }
    }
  }

  // 2. Look for any move that clears a top color to expose a different color
  for (let i = 0; i < tubes.length; i++) {
    if (tubes[i].layers.length < 2) continue; // Don't move if it's already just one color or empty
    const topColor = tubes[i].layers[tubes[i].layers.length - 1];
    const secondColor = tubes[i].layers[tubes[i].layers.length - 2];
    if (topColor === secondColor) {
        // Find if this whole stack of same color can be moved
        // For simplicity, just check the next move
    }

    for (let j = 0; j < tubes.length; j++) {
      if (i === j) continue;
      if (canMove(tubes[i], tubes[j], capacity)) {
         return { fromIndex: i, toIndex: j };
      }
    }
  }

  // 3. Fallback: Any valid move
  for (let i = 0; i < tubes.length; i++) {
    for (let j = 0; j < tubes.length; j++) {
      if (i === j) continue;
      if (canMove(tubes[i], tubes[j], capacity)) return { fromIndex: i, toIndex: j };
    }
  }

  return null;
};
