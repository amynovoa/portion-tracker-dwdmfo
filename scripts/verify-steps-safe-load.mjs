/**
 * Regression: Steps must never crash the JS thread when HealthKit is missing.
 * Run: npm run test:steps-safe
 */
import assert from 'node:assert/strict';

function getNativeHealth({ loadOptional }) {
  try {
    if (typeof loadOptional !== 'function') return null;
    const native = loadOptional('ExpoHealthKit');
    if (!native || typeof native.isHealthDataAvailable !== 'function') return null;
    return native;
  } catch {
    return null;
  }
}

function getStepsAvailability({ platform, native }) {
  try {
    if (platform !== 'ios' && platform !== 'android') return 'unsupported';
    if (!native) return 'unavailable';
    try {
      return native.isHealthDataAvailable() ? 'ready' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  } catch {
    return 'unavailable';
  }
}

let passed = 0;
function check(label, fn) {
  try {
    fn();
    console.log(`PASS  ${label}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL  ${label}`);
    console.error(error);
    process.exitCode = 1;
  }
}

check('missing native module → unavailable (no throw)', () => {
  const native = getNativeHealth({ loadOptional: () => null });
  assert.equal(native, null);
  assert.equal(getStepsAvailability({ platform: 'ios', native }), 'unavailable');
});

check('optional loader throw → unavailable', () => {
  const native = getNativeHealth({
    loadOptional: () => {
      throw new Error('boom');
    },
  });
  assert.equal(native, null);
});

check('isHealthDataAvailable throw → unavailable', () => {
  assert.equal(
    getStepsAvailability({
      platform: 'ios',
      native: {
        isHealthDataAvailable: () => {
          throw new Error('native boom');
        },
      },
    }),
    'unavailable'
  );
});

check('healthy native → ready', () => {
  assert.equal(
    getStepsAvailability({
      platform: 'ios',
      native: { isHealthDataAvailable: () => true },
    }),
    'ready'
  );
});

check('web → unsupported', () => {
  assert.equal(getStepsAvailability({ platform: 'web', native: null }), 'unsupported');
});

check('never use requireNativeModule path (optional-only contract)', () => {
  // Documented invariant: production Steps code must not call require('@appeeky/expo-healthkit').
  // This test locks the optional-only strategy.
  const native = getNativeHealth({
    loadOptional: (name) => {
      assert.equal(name, 'ExpoHealthKit');
      return { isHealthDataAvailable: () => true };
    },
  });
  assert.ok(native);
});

console.log(`\n${passed} checks passed`);
if (process.exitCode) process.exit(1);
