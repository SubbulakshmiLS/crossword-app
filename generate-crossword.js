const fs = require('fs');

const words = [
  { answer: "MENDELEEV", clue: "Periodic table given by?" },
  { answer: "LEAD", clue: "Yellow precipitate with KI for?" },
  { answer: "LASSAIGNE", clue: "Detection of N,S,halogen by?" },
  { answer: "BURETTE", clue: "Measures volume accurately?" },
  { answer: "DIAMOND", clue: "Hardest natural substance?" },
  { answer: "BLUEVITRIOL", clue: "Blue coloured hydrated salt CuSO4.5H2O?" },
  { answer: "GRAPHITE", clue: "Non-metal which is good conductor?" },
  { answer: "GATTERMANN", clue: "Benzene to benzaldehyde with CO+HCl?" },
  { answer: "HAEMATITE", clue: "Ore of iron?" },
  { answer: "ALKYNE", clue: "Unsaturated with triple bond?" },
  { answer: "DEBROGLIE", clue: "Dual nature of electron?" },
  { answer: "ACTIVATION", clue: "Which energy needed to start a reaction?" },
  { answer: "IDEALGAS", clue: "Law PV=nRT for which gas?" },
  { answer: "SORENSEN", clue: "pH scale invented by?" },
  { answer: "BENZENE", clue: "Ethyne trimerization gives?" },
  { answer: "REACTIVITY", clue: "Iron displaces Cu from CuSO4 due to higher?" },
  { answer: "ESTER", clue: "Alcohol test with acid?" },
  { answer: "MOLE", clue: "Unit of mole?" },
  { answer: "EINSTEIN", clue: "E=mc2, photoelectric effect Nobel 1921?" },
  { answer: "NITRATE", clue: "Brown ring test for?" }
];

function tryPlace(board, wordObj, maxTries = 1000) {
  const { answer } = wordObj;
  
  // Find all possible intersections
  const candidates = [];
  for (let r = 0; r < 50; r++) {
    for (let c = 0; c < 50; c++) {
      if (board[r][c] !== ' ') {
        for (let i = 0; i < answer.length; i++) {
          if (answer[i] === board[r][c]) {
            candidates.push({ r: r - i, c, dir: 'down', intersect_i: i });
            candidates.push({ r, c: c - i, dir: 'across', intersect_i: i });
          }
        }
      }
    }
  }

  // Shuffle candidates
  candidates.sort(() => Math.random() - 0.5);

  for (const cand of candidates) {
    if (canPlace(board, answer, cand.r, cand.c, cand.dir)) {
      placeWord(board, wordObj, cand.r, cand.c, cand.dir);
      return true;
    }
  }

  return false;
}

function canPlace(board, word, r, c, dir) {
  if (dir === 'across') {
    if (c < 0 || c + word.length >= 50) return false;
    
    // Check left and right bounds
    if (c > 0 && board[r][c-1] !== ' ') return false;
    if (c + word.length < 50 && board[r][c+word.length] !== ' ') return false;

    for (let i = 0; i < word.length; i++) {
      if (r < 0 || r >= 50) return false;
      const cell = board[r][c+i];
      if (cell !== ' ' && cell !== word[i]) return false;
      
      // Check top and bottom if this is not an intersection
      if (cell === ' ') {
        if (r > 0 && board[r-1][c+i] !== ' ') return false;
        if (r < 49 && board[r+1][c+i] !== ' ') return false;
      }
    }
  } else {
    if (r < 0 || r + word.length >= 50) return false;

    // Check top and bottom bounds
    if (r > 0 && board[r-1][c] !== ' ') return false;
    if (r + word.length < 50 && board[r+word.length][c] !== ' ') return false;

    for (let i = 0; i < word.length; i++) {
      if (c < 0 || c >= 50) return false;
      const cell = board[r+i][c];
      if (cell !== ' ' && cell !== word[i]) return false;

      // Check left and right if not an intersection
      if (cell === ' ') {
        if (c > 0 && board[r+i][c-1] !== ' ') return false;
        if (c < 49 && board[r+i][c+1] !== ' ') return false;
      }
    }
  }
  return true;
}

function placeWord(board, wordObj, r, c, dir) {
  wordObj.x = c;
  wordObj.y = r;
  wordObj.direction = dir;
  
  for (let i = 0; i < wordObj.answer.length; i++) {
    if (dir === 'across') {
      board[r][c+i] = wordObj.answer[i];
    } else {
      board[r+i][c] = wordObj.answer[i];
    }
  }
}

function generate() {
  let bestScore = -1;
  let bestLayout = null;

  for (let iter = 0; iter < 50000; iter++) {
    const board = Array(50).fill(null).map(() => Array(50).fill(' '));
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    // Sort slightly by length to place longer words first
    shuffledWords.sort((a, b) => b.answer.length - a.answer.length + (Math.random() * 4 - 2));

    const placed = [];
    const unplaced = [];

    // Place first word in middle
    const first = shuffledWords[0];
    placeWord(board, first, 25, 25, Math.random() > 0.5 ? 'across' : 'down');
    placed.push(first);

    for (let i = 1; i < shuffledWords.length; i++) {
      if (tryPlace(board, shuffledWords[i])) {
        placed.push(shuffledWords[i]);
      } else {
        unplaced.push(shuffledWords[i]);
      }
    }

    if (unplaced.length === 0) {
      // Calculate score based on bounding box (smaller is better)
      let minR = 50, maxR = 0, minC = 50, maxC = 0;
      for (const w of placed) {
        minR = Math.min(minR, w.y);
        maxR = Math.max(maxR, w.direction === 'down' ? w.y + w.answer.length - 1 : w.y);
        minC = Math.min(minC, w.x);
        maxC = Math.max(maxC, w.direction === 'across' ? w.x + w.answer.length - 1 : w.x);
      }
      
      const width = maxC - minC + 1;
      const height = maxR - minR + 1;
      const area = width * height;
      const score = 10000 - area;

      if (score > bestScore) {
        bestScore = score;
        // Normalize coordinates
        const layout = placed.map(w => ({
          ...w,
          x: w.x - minC,
          y: w.y - minR
        }));
        bestLayout = layout;
      }
    }
  }
  
  if (bestLayout) {
    // Add numbers
    bestLayout.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    
    let num = 1;
    for (let i = 0; i < bestLayout.length; i++) {
      const w = bestLayout[i];
      // Check if another word starts at the same spot
      const sameSpot = bestLayout.find(other => other !== w && other.x === w.x && other.y === w.y);
      
      if (sameSpot && bestLayout.indexOf(sameSpot) < i) {
        w.number = sameSpot.number;
      } else {
        w.number = num++;
      }
    }

    fs.writeFileSync('layout.json', JSON.stringify(bestLayout, null, 2));
    console.log("Layout generated successfully! Bounding box score:", bestScore);
  } else {
    console.log("Failed to place all words after many iterations.");
  }
}

generate();
