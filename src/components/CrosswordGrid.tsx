import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useCrossword } from '../hooks/useCrossword';
import './CrosswordGrid.css';

interface CrosswordGridProps {
  state: ReturnType<typeof useCrossword>;
}

export function CrosswordGrid({ state }: CrosswordGridProps) {
  const { grid, inputs, selectedCell, activeWord, handleCellClick, handleKeyDown, showValidation } = state;
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Focus the input when selectedCell changes
  useEffect(() => {
    if (selectedCell) {
      const el = inputRefs.current[`${selectedCell.r},${selectedCell.c}`];
      if (el) el.focus();
    }
  }, [selectedCell]);

  const isCellInActiveWord = (r: number, c: number) => {
    if (!activeWord) return false;
    if (activeWord.direction === 'across') {
      return r === activeWord.y && c >= activeWord.x && c < activeWord.x + activeWord.answer.length;
    } else {
      return c === activeWord.x && r >= activeWord.y && r < activeWord.y + activeWord.answer.length;
    }
  };

  if (!grid || grid.length === 0) return <div>Loading grid...</div>;

  return (
    <div className="crossword-grid-container">
      <div 
        className="crossword-grid" 
        style={{ 
          gridTemplateRows: `repeat(${grid.length}, 1fr)`,
          gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` 
        }}
      >
        {grid.map((row, r) => (
          <React.Fragment key={`row-${r}`}>
            {row.map((cell, c) => {
              if (!cell) {
                return <div key={`empty-${r}-${c}`} className="crossword-cell empty" />;
              }

              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const inActiveWord = isCellInActiveWord(r, c);
              const val = inputs[`${r},${c}`] || '';
              const allowedLetters = cell.lettersByWord ? Object.values(cell.lettersByWord) : [cell.correctLetter];
              const isCorrect = showValidation && allowedLetters.includes(val);
              const isIncorrect = showValidation && val !== '' && !allowedLetters.includes(val);

              return (
                <div 
                  key={`cell-${r}-${c}`} 
                  className={clsx(
                    'crossword-cell',
                    inActiveWord && 'in-active-word',
                    isSelected && 'selected',
                    isCorrect && 'correct',
                    isIncorrect && 'incorrect'
                  )}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell.number && <span className="cell-number">{cell.number}</span>}
                  <input
                    ref={el => { inputRefs.current[`${r},${c}`] = el; }}
                    type="text"
                    maxLength={1}
                    value={val}
                    readOnly // Handled by keydown
                    onKeyDown={(e) => handleKeyDown(e, r, c)}
                    onFocus={() => handleCellClick(r, c)}
                    className="cell-input"
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
