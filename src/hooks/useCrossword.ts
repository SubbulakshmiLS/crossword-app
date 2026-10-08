import { useState, useCallback, useMemo } from 'react';
import layoutData from '../data/layout.json';

export type Direction = 'across' | 'down';

export interface LayoutWord {
  answer: string;
  clue: string;
  x: number;
  y: number;
  direction: Direction;
  number: number;
}

export interface CellData {
  r: number;
  c: number;
  correctLetter: string;
  lettersByWord?: Record<number, string>;
  number?: number;
  wordNumbers: number[]; // Words that share this cell
}

export function useCrossword() {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [direction, setDirection] = useState<Direction>('across');
  const [showValidation, setShowValidation] = useState(false);

  // Compute grid boundaries and cells
  const { grid, maxR, maxC, cellsMap, wordsMap } = useMemo(() => {
    let mR = 0, mC = 0;
    const map = new Map<string, CellData>();
    const wMap = new Map<number, LayoutWord>();

    layoutData.forEach((w: any) => {
      wMap.set(w.number, w as LayoutWord);
      for (let i = 0; i < w.answer.length; i++) {
        const r = w.direction === 'down' ? w.y + i : w.y;
        const c = w.direction === 'across' ? w.x + i : w.x;
        mR = Math.max(mR, r);
        mC = Math.max(mC, c);
        
        const key = `${r},${c}`;
        if (!map.has(key)) {
          map.set(key, { 
            r, 
            c, 
            correctLetter: w.answer[i], 
            lettersByWord: { [w.number]: w.answer[i] },
            wordNumbers: [w.number] 
          });
        } else {
          const cell = map.get(key)!;
          cell.wordNumbers.push(w.number);
          if (!cell.lettersByWord) cell.lettersByWord = {};
          cell.lettersByWord[w.number] = w.answer[i];
        }
        
        // Add number to the first cell of the word
        if (i === 0) {
          map.get(key)!.number = w.number;
        }
      }
    });

    const g: (CellData | null)[][] = [];
    for (let r = 0; r <= mR; r++) {
      const row: (CellData | null)[] = [];
      for (let c = 0; c <= mC; c++) {
        row.push(map.get(`${r},${c}`) || null);
      }
      g.push(row);
    }

    return { grid: g, maxR: mR, maxC: mC, cellsMap: map, wordsMap: wMap };
  }, []);

  const getActiveWordNumber = useCallback((r: number, c: number, d: Direction): number | null => {
    const cell = cellsMap.get(`${r},${c}`);
    if (!cell) return null;
    
    const wordNum = cell.wordNumbers.find(num => {
      const w = wordsMap.get(num);
      return w?.direction === d;
    });

    if (wordNum !== undefined) return wordNum;
    return cell.wordNumbers[0] || null;
  }, [cellsMap, wordsMap]);

  const getActiveWord = useCallback((r: number, c: number, d: Direction) => {
    const num = getActiveWordNumber(r, c, d);
    if (num !== null) {
      return wordsMap.get(num);
    }
    return null;
  }, [getActiveWordNumber, wordsMap]);

  // Initial selection
  if (!selectedCell && grid.length > 0) {
    const firstWord = layoutData.find(w => w.number === 1) || layoutData[0];
    if (firstWord) {
      setSelectedCell({ r: firstWord.y, c: firstWord.x });
      setDirection(firstWord.direction as Direction);
    }
  }

  const handleCellClick = (r: number, c: number) => {
    if (showValidation) setShowValidation(false);

    if (selectedCell?.r === r && selectedCell?.c === c) {
      const cell = cellsMap.get(`${r},${c}`);
      if (cell && cell.wordNumbers.length > 1) {
        setDirection(prev => prev === 'across' ? 'down' : 'across');
      }
    } else {
      setSelectedCell({ r, c });
      const cell = cellsMap.get(`${r},${c}`);
      if (cell) {
        const hasCurrentDir = cell.wordNumbers.some(num => wordsMap.get(num)?.direction === direction);
        if (!hasCurrentDir) {
          setDirection(direction === 'across' ? 'down' : 'across');
        }
      }
    }
  };

  const moveToNextCell = (r: number, c: number, d: Direction, delta: 1 | -1 = 1) => {
    const w = getActiveWord(r, c, d);
    if (!w) return;

    if (d === 'across') {
      const nextC = c + delta;
      if (nextC >= w.x && nextC < w.x + w.answer.length) {
        setSelectedCell({ r, c: nextC });
      }
    } else {
      const nextR = r + delta;
      if (nextR >= w.y && nextR < w.y + w.answer.length) {
        setSelectedCell({ r: nextR, c });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    if (showValidation) setShowValidation(false);

    if (e.key === 'ArrowRight') {
      setSelectedCell({ r, c: Math.min(maxC, c + 1) });
      setDirection('across');
    } else if (e.key === 'ArrowLeft') {
      setSelectedCell({ r, c: Math.max(0, c - 1) });
      setDirection('across');
    } else if (e.key === 'ArrowDown') {
      setSelectedCell({ r: Math.min(maxR, r + 1), c });
      setDirection('down');
    } else if (e.key === 'ArrowUp') {
      setSelectedCell({ r: Math.max(0, r - 1), c });
      setDirection('down');
    } else if (e.key === 'Backspace') {
      if (inputs[`${r},${c}`]) {
        setInputs(prev => ({ ...prev, [`${r},${c}`]: '' }));
      } else {
        moveToNextCell(r, c, direction, -1);
      }
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      setInputs(prev => ({ ...prev, [`${r},${c}`]: e.key.toUpperCase() }));
      moveToNextCell(r, c, direction, 1);
    }
  };

  // Calculate score: 1 point per fully correct word
  const score = useMemo(() => {
    if (!showValidation) return null;
    let correct = 0;
    for (const word of wordsMap.values()) {
      let wordCorrect = true;
      for (let i = 0; i < word.answer.length; i++) {
        const r = word.direction === 'down' ? word.y + i : word.y;
        const c = word.direction === 'across' ? word.x + i : word.x;
        const val = inputs[`${r},${c}`] || '';
        if (val !== word.answer[i]) { wordCorrect = false; break; }
      }
      if (wordCorrect) correct++;
    }
    return { correct, total: wordsMap.size };
  }, [showValidation, inputs, wordsMap]);

  const activeWordNum = selectedCell ? getActiveWordNumber(selectedCell.r, selectedCell.c, direction) : null;
  const activeWord = activeWordNum ? wordsMap.get(activeWordNum) : null;

  return {
    grid,
    inputs,
    selectedCell,
    direction,
    showValidation,
    activeWord,
    score,
    handleCellClick,
    handleKeyDown,
    setShowValidation,
    layoutData: layoutData as LayoutWord[]
  };
}
