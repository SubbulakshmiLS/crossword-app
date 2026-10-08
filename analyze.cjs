/**
 * Deep crossword analysis script
 * Prints full grid, all intersections, and conflict details
 */
const fs = require('fs');
const layout = JSON.parse(fs.readFileSync('./src/data/layout.json', 'utf8'));

// Build cell map
const cellMap = new Map();
for (const word of layout) {
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.direction === 'down' ? word.y + i : word.y;
    const c = word.direction === 'across' ? word.x + i : word.x;
    const key = `${c},${r}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key).push({ letter: word.answer[i], wordNum: word.number, direction: word.direction, wordName: word.answer, pos: i });
  }
}

// Print each word's letter positions
console.log('=== All Words Cell Positions ===');
for (const word of layout) {
  const cells = [];
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.direction === 'down' ? word.y + i : word.y;
    const c = word.direction === 'across' ? word.x + i : word.x;
    cells.push(`(col=${c},row=${r})=${word.answer[i]}`);
  }
  console.log(`#${word.number} ${word.answer} (${word.direction}) starts at x=${word.x},y=${word.y}`);
  console.log(`  Cells: ${cells.join(', ')}`);
}

// Check conflicts
console.log('\n=== Conflict Analysis ===');
let conflicts = 0;
for (const [key, entries] of cellMap) {
  if (entries.length > 1) {
    const letters = new Set(entries.map(e => e.letter));
    const status = letters.size > 1 ? 'CONFLICT' : 'OK';
    if (letters.size > 1) {
      conflicts++;
      console.log(`${status} at (${key}):`);
      for (const e of entries) {
        console.log(`  ${e.wordName}[${e.pos}]=${e.letter} (${e.direction} #${e.wordNum})`);
      }
    }
  }
}
console.log(`\nTotal conflicts: ${conflicts}`);
