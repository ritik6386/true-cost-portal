import test from 'node:test';
import assert from 'node:assert/strict';
import { cn } from '../utils.ts';

test('cn merges basic string classes correctly', () => {
  const result = cn('font-bold', 'text-center');
  assert.strictEqual(result, 'font-bold text-center');
});

test('cn resolves Tailwind class conflicts with last-wins precedence', () => {
  const result = cn('px-2 py-1', 'px-4');
  assert.strictEqual(result, 'py-1 px-4');

  const colorResult = cn('text-red-500', 'text-blue-600');
  assert.strictEqual(colorResult, 'text-blue-600');
});

test('cn handles conditional and falsy values', () => {
  const isSelected = true;
  const isDisabled = false;
  const result = cn(
    'btn',
    isSelected && 'btn-selected',
    isDisabled && 'btn-disabled',
    null,
    undefined,
    false
  );
  assert.strictEqual(result, 'btn btn-selected');
});

test('cn handles arrays and object notations', () => {
  const result = cn(['flex', 'items-center'], { 'opacity-50': true, 'hidden': false });
  assert.strictEqual(result, 'flex items-center opacity-50');
});

test('cn handles empty input', () => {
  const result = cn();
  assert.strictEqual(result, '');
});
