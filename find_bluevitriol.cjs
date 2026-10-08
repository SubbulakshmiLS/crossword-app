/**
 * Find a column for BLUEVITRIOL (down, y=5, length=11) that has ZERO conflicts with across words
 * Check cols 15–20 (away from ALKYNE, DEBROGLIE, ACTIVATION, REACTIVITY, EINSTEIN ranges)
 */
const baseWords = [
  { answer: "MENDELEEV",  x: 19, y: 0,  direction: "down",   number: 1  },
  { answer: "LEAD",       x: 6,  y: 1,  direction: "down",   number: 2  },
  { answer: "LASSAIGNE",  x: 11, y: 1,  direction: "across", number: 3  },
  { answer: "BURETTE",    x: 3,  y: 2,  direction: "across", number: 4  },
  { answer: "DIAMOND",    x: 13, y: 3,  direction: "across", number: 5  },
  { answer: "GRAPHITE",   x: 0,  y: 5,  direction: "down",   number: 7  },
  { answer: "GATTERMANN", x: 3,  y: 6,  direction: "down",   number: 8  },
  { answer: "HAEMATITE",  x: 6,  y: 7,  direction: "down",   number: 9  },
  { answer: "ALKYNE",     x: 9,  y: 5,  direction: "across", number: 10 },
  { answer: "DEBROGLIE",  x: 9,  y: 7,  direction: "across", number: 11 },
  { answer: "ACTIVATION", x: 6,  y: 8,  direction: "across", number: 12 },
  { answer: "IDEALGAS",   x: 13, y: 8,  direction: "down",   number: 13 },
  { answer: "SORENSEN",   x: 1,  y: 11, direction: "down",   number: 14 },
  { answer: "BENZENE",    x: 17, y: 13, direction: "down",   number: 15 },
  { answer: "REACTIVITY", x: 1,  y: 13, direction: "across", number: 16 },
  { answer: "ESTER",      x: 14, y: 13, direction: "down",   number: 17 },
  { answer: "MOLE",       x: 7,  y: 15, direction: "across", number: 18 },
  { answer: "EINSTEIN",   x: 10, y: 15, direction: "across", number: 19 },
  { answer: "NITRATE",    x: 1,  y: 18, direction: "across", number: 20 },
];

// Across words and their occupied cols per row
const acrossOccupied = new Map(); // key = `col,row`, val = {letter, wordName}
for (const word of baseWords) {
  if (word.direction === 'across') {
    for (let i = 0; i < word.answer.length; i++) {
      const c = word.x + i;
      const r = word.y;
      acrossOccupied.set(`${c},${r}`, { letter: word.answer[i], wordName: word.answer });
    }
  }
}

// Try every col from 0 to 22, starting rows from 0 to 10 for BLUEVITRIOL (length 11)
const bv = "BLUEVITRIOL";
let found = [];
for (let x = 0; x <= 22; x++) {
  for (let y = 0; y <= 10; y++) {
    let conflicts = 0, oks = [];
    for (let i = 0; i < bv.length; i++) {
      const r = y + i;
      const key = `${x},${r}`;
      if (acrossOccupied.has(key)) {
        const cell = acrossOccupied.get(key);
        if (cell.letter === bv[i]) {
          oks.push(`row${r}:${bv[i]}=${cell.wordName}`);
        } else {
          conflicts++;
        }
      }
    }
    if (conflicts === 0 && oks.length >= 2) {
      found.push({ x, y, oks: oks.join(', ') });
    }
  }
}

console.log('=== BLUEVITRIOL positions with 0 conflicts and >=2 intersections ===');
for (const f of found) {
  console.log(`x=${f.x} y=${f.y}: ${f.oks}`);
}
if (found.length === 0) {
  console.log('No position found with >=2 intersections. Showing all 0-conflict with >=1:');
  for (let x = 0; x <= 22; x++) {
    for (let y = 0; y <= 10; y++) {
      let conflicts = 0, oks = [];
      for (let i = 0; i < bv.length; i++) {
        const r = y + i;
        const key = `${x},${r}`;
        if (acrossOccupied.has(key)) {
          const cell = acrossOccupied.get(key);
          if (cell.letter === bv[i]) oks.push(`row${r}:${bv[i]}=${cell.wordName}`);
          else conflicts++;
        }
      }
      if (conflicts === 0 && oks.length >= 1) {
        console.log(`x=${x} y=${y}: ${oks.join(', ')}`);
      }
    }
  }
}
