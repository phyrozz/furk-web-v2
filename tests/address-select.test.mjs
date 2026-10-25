import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = await readFile(new URL('../src/components/pages/Merchant/MerchantVerification/AddressSelect.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
} }).outputText;

function select() {
  const slots = [];
  let cursor = 0;
  let tree;
  let value = 'LAGUNA';
  const changes = [];
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react') return { useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    } };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'lucide-react') return { ChevronDown: 'ChevronDown' };
    throw new Error(`Unexpected import ${name}`);
  } });
  function render() {
    cursor = 0;
    tree = exports.default({ id: 'province', label: 'Province', options: ['CAVITE', 'LAGUNA'], value, onChange(next) { value = next; changes.push(next); } });
  }
  function nodes(type) {
    const found = [];
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) return node.forEach(visit);
      if (node.type === type) found.push(node);
      visit(node.props?.children);
    }
    visit(tree);
    return found;
  }
  render();
  return { changes, nodes, render };
}

test('address selection filters immediately and selects with the keyboard', () => {
  const field = select();
  field.nodes('input')[0].props.onFocus({ currentTarget: { select() {} } }); field.render();
  field.nodes('input')[0].props.onChange({ target: { value: 'cav' } }); field.render();
  assert.equal(field.nodes('button').length, 1);
  field.nodes('input')[0].props.onKeyDown({ key: 'ArrowDown', preventDefault() {} }); field.render();
  field.nodes('input')[0].props.onKeyDown({ key: 'Enter', preventDefault() {} }); field.render();
  assert.deepEqual(field.changes, ['CAVITE']);
  assert.equal(field.nodes('input')[0].props.value, 'CAVITE');
  assert.equal(field.nodes('input')[0].props['aria-expanded'], false);
  // Selection keeps focus on the input; clicking it must still reopen the menu.
  field.nodes('input')[0].props.onClick(); field.render();
  assert.equal(field.nodes('button').length, 2);
});

test('unmatched typed text is not saved and Escape restores the selected address', () => {
  const field = select();
  field.nodes('input')[0].props.onChange({ target: { value: 'Missing province' } }); field.render();
  field.nodes('input')[0].props.onKeyDown({ key: 'ArrowUp', preventDefault() {} }); field.render();
  assert.equal(field.nodes('input')[0].props['aria-activedescendant'], undefined);
  field.nodes('input')[0].props.onKeyDown({ key: 'Escape' }); field.render();
  assert.equal(field.nodes('input')[0].props.value, 'LAGUNA');
  assert.equal(field.changes.length, 0);
});
