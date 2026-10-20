import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/tour-layout.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const { getTourScrollDelta } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const phoneRegion = { top: 86, bottom: 272 };

test('My Pets and Add Pet move completely above a mobile sheet on a short page', () => {
  for (const target of [{ top: 510, height: 44 }, { top: 730, height: 44 }]) {
    const delta = getTourScrollDelta(target, phoneRegion);
    assert.ok(delta > 0);
    assert.ok(target.top - delta >= phoneRegion.top);
    assert.ok(target.top - delta + target.height <= phoneRegion.bottom);
    assert.equal(getTourScrollDelta({ ...target, top: target.top - delta }, phoneRegion), 0);
  }
});

test('a layout shift after switching profile tabs triggers another scroll', () => {
  const target = { top: 100, height: 44 };
  assert.equal(getTourScrollDelta(target, phoneRegion), 0);
  const shifted = { ...target, top: 390 };
  const delta = getTourScrollDelta(shifted, phoneRegion);
  assert.ok(delta > 0);
  assert.ok(shifted.top - delta + shifted.height <= phoneRegion.bottom);
});

test('a target moved behind the navbar is brought back into view', () => {
  const target = { top: 20, height: 44 };
  const delta = getTourScrollDelta(target, phoneRegion);
  assert.ok(delta < 0);
  assert.ok(target.top - delta >= phoneRegion.top);
});

test('a taller sheet after a viewport change realigns a previously visible target', () => {
  const target = { top: 220, height: 44 };
  assert.equal(getTourScrollDelta(target, phoneRegion), 0);
  const shorterRegion = { top: 86, bottom: 190 };
  const delta = getTourScrollDelta(target, shorterRegion);
  assert.ok(delta > 0);
  assert.ok(target.top - delta + target.height <= shorterRegion.bottom);
});

test('oversized targets align with the top and fractional pixels do not cause a scroll loop', () => {
  assert.equal(getTourScrollDelta({ top: 86, height: 400 }, phoneRegion), 0);
  assert.equal(getTourScrollDelta({ top: 85.5, height: 44 }, phoneRegion), 0);
  assert.equal(getTourScrollDelta({ top: 500, height: 44 }, { top: 100, bottom: 90 }), 0);
});
