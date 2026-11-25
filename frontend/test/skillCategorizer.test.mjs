import test from 'node:test';
import assert from 'node:assert/strict';
import { categorizeSkills, categorizeSingleSkill, CATEGORY_ORDER } from '../src/utils/skillCategorizer.js';

test('1. Programming languages only: groups all under Programming Languages category', () => {
  const input = ['Python', 'Java', 'C++', 'TypeScript', 'Rust'];
  const categorized = categorizeSkills(input);

  assert.equal(categorized.length, 1);
  assert.equal(categorized[0].category, 'Programming Languages');
  assert.deepEqual(categorized[0].skills, ['Python', 'Java', 'C++', 'TypeScript', 'Rust']);
});

test('2. Mix of programming, frontend, backend, database, and tools matches user specification', () => {
  const input = ['Python', 'Java', 'HTML', 'CSS', 'React', 'FastAPI', 'MySQL', 'Git', 'Postman'];
  const categorized = categorizeSkills(input);

  const catMap = Object.fromEntries(categorized.map((c) => [c.category, c.skills]));

  assert.deepEqual(catMap['Programming Languages'], ['Python', 'Java']);
  assert.deepEqual(catMap['Frontend'], ['HTML', 'CSS', 'React']);
  assert.deepEqual(catMap['Backend'], ['FastAPI']);
  assert.deepEqual(catMap['Databases'], ['MySQL']);
  assert.deepEqual(catMap['Tools'], ['Git', 'Postman']);
});

test('3. Non-programming skills: communication, leadership, Excel, Figma, and cloud skills', () => {
  const input = ['Communication', 'Leadership', 'Excel', 'Figma', 'AWS', 'Docker'];
  const categorized = categorizeSkills(input);

  const catMap = Object.fromEntries(categorized.map((c) => [c.category, c.skills]));

  assert.deepEqual(catMap['Soft Skills'], ['Communication', 'Leadership']);
  assert.deepEqual(catMap['Tools'], ['Excel']);
  assert.deepEqual(catMap['Design'], ['Figma']);
  assert.deepEqual(catMap['Cloud & DevOps'], ['AWS', 'Docker']);
});

test('4. Custom or unfamiliar skills: placed under Other Skills when mixed', () => {
  const input = ['Python', 'Quantum Circuit Design', 'Neurobiology Mapping'];
  const categorized = categorizeSkills(input);

  const catMap = Object.fromEntries(categorized.map((c) => [c.category, c.skills]));

  assert.deepEqual(catMap['Programming Languages'], ['Python']);
  assert.deepEqual(catMap['Other Skills'], ['Quantum Circuit Design', 'Neurobiology Mapping']);
});

test('5. Single unfamiliar skill or only unfamiliar skills: clean layout without unnecessary headings', () => {
  const input = ['Quantum Circuit Design', 'Neurobiology Mapping'];
  const categorized = categorizeSkills(input);

  assert.equal(categorized.length, 1);
  // Rule 6: category is empty string so it renders without an unnecessary 'Other Skills' heading
  assert.equal(categorized[0].category, '');
  assert.deepEqual(categorized[0].skills, ['Quantum Circuit Design', 'Neurobiology Mapping']);
});

test('6. Empty skills: returns empty array', () => {
  assert.deepEqual(categorizeSkills([]), []);
  assert.deepEqual(categorizeSkills(null), []);
  assert.deepEqual(categorizeSkills(undefined), []);
});

test('7. Duplicate skills: deduplicates case-insensitively and preserves first entered casing', () => {
  const input = ['Python', 'python', 'PYTHON', 'React', 'react', 'FASTAPI', 'FastAPI'];
  const categorized = categorizeSkills(input);

  const catMap = Object.fromEntries(categorized.map((c) => [c.category, c.skills]));

  assert.deepEqual(catMap['Programming Languages'], ['Python']);
  assert.deepEqual(catMap['Frontend'], ['React']);
  assert.deepEqual(catMap['Backend'], ['FASTAPI']);
});

test('8. Handles pre-structured dictionary gracefully', () => {
  const input = {
    'Programming Languages': ['Go', 'Rust'],
    'Databases': ['PostgreSQL', 'Redis'],
  };
  const categorized = categorizeSkills(input);

  assert.equal(categorized.length, 2);
  assert.equal(categorized[0].category, 'Programming Languages');
  assert.deepEqual(categorized[0].skills, ['Go', 'Rust']);
  assert.equal(categorized[1].category, 'Databases');
  assert.deepEqual(categorized[1].skills, ['PostgreSQL', 'Redis']);
});

test('9. Testing and Data Science categories are properly populated', () => {
  const input = ['PyTest', 'Jest', 'Cypress', 'PyTorch', 'TensorFlow', 'Pandas'];
  const categorized = categorizeSkills(input);

  const catMap = Object.fromEntries(categorized.map((c) => [c.category, c.skills]));

  assert.deepEqual(catMap['Testing'], ['PyTest', 'Jest', 'Cypress']);
  assert.deepEqual(catMap['Data Science & AI'], ['PyTorch', 'TensorFlow', 'Pandas']);
});
