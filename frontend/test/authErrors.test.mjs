import test from 'node:test';
import assert from 'node:assert/strict';

import { isSessionRejection } from '../src/services/authErrors.js';

test('only definitive authentication responses reject the browser session', () => {
  assert.equal(isSessionRejection({ response: { status: 401 } }), true);
  assert.equal(isSessionRejection({ response: { status: 403 } }), true);
  assert.equal(isSessionRejection({ response: { status: 500 } }), false);
  assert.equal(isSessionRejection({ code: 'ECONNABORTED' }), false);
  assert.equal(isSessionRejection(undefined), false);
});
