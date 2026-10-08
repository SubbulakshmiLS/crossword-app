/**
 * Try multiple BLUEVITRIOL positions to find zero-conflict placement
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

// Try candidate positions for BLUEVITRIOL
const candidates = [
  { x: 10, y: 4 }, // current
  { x: 11, y: 7 }, // B=DEBROGLIE[2]
  { x: 12, y: 5 }, // Y=ALKYNE[3]?
  { x: 12, y: 7 }, // R=DEBROGLIE[3]?
  { x: 14, y: 5 }, // E=ALKYNE[5]?
  { x: 14, y: 7 }, // G=DEBROGLIE[5]?
];

for (const cand of candidates) {
  const words = [...baseWords, { answer: "BLUEVITRIOL", x: cand.x, y: cand.y, direction: "down", number: 6 }];
  const cellMap = new Map();
  for (const word of words) {
    for (let i = 0; i < word.answer.length; i++) {
      const r = word.direction === 'down' ? word.y + i : word.y;
      const c = word.direction === 'across' ? word.x + i : word.x;
      const key = `${c},${r}`;
      if (!cellMap.has(key)) cellMap.set(key, []);
      cellMap.get(key).push({ letter: word.answer[i], wordNum: word.number, direction: word.direction, wordName: word.answer, pos: i });
    }
  }
  let conflicts = 0, oks = [];
  for (const [key, entries] of cellMap) {
    if (entries.length > 1) {
      const letters = new Set(entries.map(e => e.letter));
      if (letters.size > 1) { conflicts++; }
      else oks.push(`${key}:${entries[0].letter}(${entries.map(e=>e.wordName+'['+e.pos+']').join('&')})`);
    }
  }
  console.log(`BLUEVITRIOL x=${cand.x} y=${cand.y} → conflicts=${conflicts}, OKs: ${oks.join(', ')}`);
}
const words = baseWords;

const cellMap = new Map();
for (const word of words) {
  for (let i = 0; i < word.answer.length; i++) {
    const r = word.direction === 'down' ? word.y + i : word.y;
    const c = word.direction === 'across' ? word.x + i : word.x;
    const key = `${c},${r}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key).push({ letter: word.answer[i], wordNum: word.number, direction: word.direction, wordName: word.answer, pos: i });
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
      for (const e of entries) console.log(`  ${e.wordName}[${e.pos}]=${e.letter} (${e.direction} #${e.wordNum})`);
    } else {
      console.log(`OK at (${key}): ${entries[0].letter} - ${entries.map(e => `${e.wordName}[${e.pos}]`).join(' & ')}`);
    }
  }
}
console.log(`\nTotal conflicts: ${conflicts}`);
