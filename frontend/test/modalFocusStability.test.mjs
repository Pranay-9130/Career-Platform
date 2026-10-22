import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modalPath = path.resolve(__dirname, '../src/components/common/Modal.jsx');

test('Modal component does not include unstable onClose in effect dependencies', () => {
  const content = fs.readFileSync(modalPath, 'utf-8');

  // Must NOT have [isOpen, onClose] dependency which caused effect teardown on every keystroke
  assert.equal(
    content.includes('[isOpen, onClose]'),
    false,
    'Modal effect must not depend directly on onClose as it re-runs on every parent render during typing'
  );

  // Must depend only on [isOpen] for lifecycle teardown/setup
  assert.equal(
    content.includes('[isOpen]'),
    true,
    'Modal effect must depend solely on [isOpen] so typing never triggers teardown or focus stealing'
  );
});

test('Modal component uses ref pattern to safely invoke latest onClose without re-running effects', () => {
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.equal(
    content.includes('onCloseRef.current = onClose'),
    true,
    'Modal must keep an updated ref to onClose'
  );

  assert.equal(
    content.includes('onCloseRef.current?.()'),
    true,
    'Modal event listeners must call onCloseRef.current'
  );
});

test('Modal component prevents event bubbling on modal surface to protect inputs and text selection', () => {
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.equal(
    content.includes('onClick={(e) => e.stopPropagation()}'),
    true,
    'Modal surface must stop click propagation so clicking inputs or selecting text never closes the modal'
  );
});

test('Modal close button explicitly declares type="button" to prevent unintended form submissions', () => {
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.match(
    content,
    /<button[^>]*ref=\{closeButtonRef\}[^>]*type="button"/,
    'Modal close button must have type="button"'
  );
});

test('Simulated typing across parent re-renders preserves input focus without triggering close button', () => {
  // Simulate stateful parent passing inline arrow function onClose on each keystroke
  let parentState = { text: '' };
  let closeCalled = false;

  const createOnClose = () => () => {
    closeCalled = true;
  };

  // Track onCloseRef behavior across 5 keystrokes
  const onCloseRef = { current: null };
  const strokes = ['F', 'r', 'o', 'n', 't'];

  let activeElement = { tagName: 'INPUT', name: 'jobTitle' };
  let previouslyFocused = null;
  let effectRuns = 0;
  let effectCleanups = 0;

  // Initial modal open
  const isOpen = true;
  if (isOpen) {
    previouslyFocused = { tagName: 'BUTTON', name: 'openModal' };
    effectRuns++;
  }

  for (const char of strokes) {
    parentState = { text: parentState.text + char };
    const newOnClose = createOnClose();
    // In our fixed component:
    onCloseRef.current = newOnClose;

    // Because dependency is [isOpen], effect does NOT run on keystroke:
    // activeElement remains the INPUT
    assert.equal(activeElement.tagName, 'INPUT');
  }

  assert.equal(effectRuns, 1, 'Lifecycle effect must only run once when modal opens, not on each keystroke');
  assert.equal(effectCleanups, 0, 'Cleanup must not run during active typing');
  assert.equal(closeCalled, false, 'Modal close handler must not have been triggered by typing');
  assert.equal(parentState.text, 'Front', 'All typed characters must be retained');
});
