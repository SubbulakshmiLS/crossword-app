// Read current layout.json and verify all intersections
const fs = require('fs');
const layout = JSON.parse(fs.readFileSync('./src/data/layout.json', 'utf8'));

// Build a map of (col, row) -> { letter, wordNumber, direction }[]
const cellMap = new Map();

for (const word of layout) {
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.direction === 'down' ? word.y + i : word.y;
    const c = word.direction === 'across' ? word.x + i : word.x;
    const key = `${c},${r}`;
    if (!cellMap.has(key)) {
      cellMap.set(key, []);
    }
    cellMap.get(key).push({
      letter: word.answer[i],
      wordNum: word.number,
      direction: word.direction,
      wordName: word.answer,
      pos: i
    });
  }
}

console.log('=== Intersection Check ===');
let conflicts = 0;
for (const [key, entries] of cellMap) {
  if (entries.length > 1) {
    const letters = new Set(entries.map(e => e.letter));
    if (letters.size > 1) {
      conflicts++;
      console.log(`CONFLICT at (${key}):`);
      for (const e of entries) {
        console.log(`  ${e.wordName}[${e.pos}]=${e.letter} (${e.direction} #${e.wordNum})`);
      }
    } else {
      console.log(`OK at (${key}): ${entries[0].letter} - ${entries.map(e => `${e.wordName}[${e.pos}]`).join(' & ')}`);
    }
  }
}

console.log(`\nTotal conflicts: ${conflicts}`);
console.log('\n=== Grid Summary ===');
let maxR = 0, maxC = 0;
for (const [key] of cellMap) {
  const [c, r] = key.split(',').map(Number);
  maxR = Math.max(maxR, r);
  maxC = Math.max(maxC, c);
}
console.log(`Grid size: ${maxC+1} columns x ${maxR+1} rows`);
