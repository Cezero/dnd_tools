// convert-spells.js
import fs from 'fs';

const lines = fs.readFileSync('spells.tsv', 'utf-8').trim().split('\n');
const [header, ...rows] = lines;
const keys = header.split('\t');

const output = {};

for (const row of rows) {
  const values = row.split('\t');
  const entry = Object.fromEntries(keys.map((k, i) => [k, isNaN(values[i]) ? values[i] : Number(values[i])]));
  output[entry.id] = entry;
}
console.log('{');
const entries = Object.entries(output);
entries.forEach(([key, value], index) => {
  const comma = index < entries.length - 1 ? ',' : '';
  console.log(`"${key}":${JSON.stringify(value)}${comma}`);
});
console.log('}');
