import { useState } from 'react';
import { CrosswordGrid } from './components/CrosswordGrid';
import { CluesList } from './components/CluesList';
import { StudentForm, type StudentInfo } from './components/StudentForm';
import { useCrossword } from './hooks/useCrossword';
import './App.css';

function App() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const crosswordState = useCrossword();
  const { showValidation, setShowValidation, score } = crosswordState;

  // PDF download via print
  const handleDownload = () => {
    window.print();
  };

  const handleReset = () => {
    window.location.reload();
  };

  if (!student) {
    return <StudentForm onStart={setStudent} />;
  }

  return (
    <div className="app-container" id="printable-area">
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="header-badge">⚗️ Chemistry</div>
          <h1>Chemistry Crossword</h1>
          <p>Test your knowledge of elements, reactions, and famous chemists.</p>
        </div>

        {/* Student Info Strip */}
        <div className="student-strip">
          <div className="student-detail">
            <span className="detail-label">Name</span>
            <span className="detail-value">{student.name}</span>
          </div>
          <div className="student-detail">
            <span className="detail-label">Class</span>
            <span className="detail-value">{student.className}</span>
          </div>
          <div className="student-detail">
            <span className="detail-label">School</span>
            <span className="detail-value">{student.school}</span>
          </div>
          <div className="student-detail score-detail">
            <span className="detail-label">Score</span>
            <span className="detail-value score-value">
              {score ? `${score.correct} / ${score.total}` : '— / 20'}
            </span>
          </div>
        </div>
      </header>

      {/* Score Banner */}
      {showValidation && score && (
        <div className={`score-banner fade-in ${score.correct === score.total ? 'perfect' : score.correct >= score.total * 0.7 ? 'good' : 'needs-work'}`}>
          <div className="score-banner-inner">
            <span className="score-emoji">
              {score.correct === score.total ? '🏆' : score.correct >= score.total * 0.7 ? '🌟' : '📚'}
            </span>
            <div className="score-text">
              <strong>
                {score.correct === score.total
                  ? 'Perfect Score! All correct!'
                  : `You scored ${score.correct} out of ${score.total}`}
              </strong>
              <span>{score.correct} point{score.correct !== 1 ? 's' : ''} — 1 point per correct word</span>
            </div>
            <div className="score-badge">{score.correct}/{score.total}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="app-content">
        <div className="board-section">
          <CrosswordGrid state={crosswordState} />

          <div className="controls">
            <button
              id="btn-check"
              className={`btn primary ${showValidation ? 'active' : ''}`}
              onClick={() => setShowValidation(!showValidation)}
            >
              {showValidation ? '🙈 Hide Answers' : '✅ Check Answers'}
            </button>
            <button
              id="btn-download"
              className="btn download"
              onClick={handleDownload}
            >
              📄 Download PDF
            </button>
            <button
              id="btn-reset"
              className="btn secondary"
              onClick={handleReset}
            >
              🔄 Reset Puzzle
            </button>
          </div>
        </div>

        <div className="clues-section">
          <CluesList state={crosswordState} />
        </div>
      </div>
    </div>
  );
}

export default App;
