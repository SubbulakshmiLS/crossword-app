
import clsx from 'clsx';
import { useCrossword } from '../hooks/useCrossword';
import './CluesList.css';

interface CluesListProps {
  state: ReturnType<typeof useCrossword>;
}

export function CluesList({ state }: CluesListProps) {
  const { layoutData, activeWord, direction } = state;

  const acrossClues = layoutData.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
  const downClues = layoutData.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);

  return (
    <div className="clues-container">
      <div className="clue-column">
        <h3 className="clue-header">Across</h3>
        <ul className="clue-list">
          {acrossClues.map(w => (
            <li 
              key={`across-${w.number}`} 
              className={clsx('clue-item', activeWord?.number === w.number && direction === 'across' && 'active')}
            >
              <strong>{w.number}.</strong> {w.clue}
            </li>
          ))}
        </ul>
      </div>
      <div className="clue-column">
        <h3 className="clue-header">Down</h3>
        <ul className="clue-list">
          {downClues.map(w => (
            <li 
              key={`down-${w.number}`} 
              className={clsx('clue-item', activeWord?.number === w.number && direction === 'down' && 'active')}
            >
              <strong>{w.number}.</strong> {w.clue}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
