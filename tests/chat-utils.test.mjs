import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Pure presentation helpers only: no authentication, API, or database connections.
const source = await readFile(new URL('../src/components/pages/Chat/chat-utils.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } });
const { getConversationName, getInitials, searchConversations, updateConversationPreview, formatChatDate, formatMessageTime } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const conversation = {
  id: 1, pet_owner_id: 2, merchant_id: 3, merchant_user_id: 4,
  business_name: 'Little Paws Studio', display_name: 'Little Paws Studio',
  first_name: 'Ava', last_name: 'Cruz', created_at: '2026-10-21T09:00:00',
  last_message_content: 'Does Luna need her vaccine record?',
};

test('each audience sees the other participant, including legacy responses', () => {
  assert.equal(getConversationName(conversation, false), 'Little Paws Studio');
  assert.equal(getConversationName(conversation, true), 'Ava Cruz');
  assert.equal(getConversationName({ ...conversation, first_name: undefined, last_name: undefined }, true), 'Pet owner');
  assert.equal(getConversationName({ ...conversation, first_name: undefined, last_name: undefined, display_name: 'Ava Cruz' }, true), 'Ava Cruz');
});

test('search matches participant names and message previews without matching the merchant’s own name', () => {
  assert.equal(searchConversations([conversation], ' AVA ', true).length, 1);
  assert.equal(searchConversations([conversation], 'little paws', true).length, 0);
  assert.equal(searchConversations([conversation], 'vaccine', false).length, 1);
  assert.equal(searchConversations([conversation], 'little paws', false).length, 1);
  assert.equal(searchConversations([conversation], '  ', false).length, 1);
  assert.equal(searchConversations([{ ...conversation, last_message_content: null }], 'missing', false).length, 0);
});

test('new activity moves its conversation first and updates the preview without mutating the inbox', () => {
  const original = [{ ...conversation, id: 5 }, conversation];
  const updated = updateConversationPreview(original, { conversation_id: 1, content: 'See you tomorrow!', created_at: '2026-10-21T10:00:00' });
  assert.deepEqual(updated.map(item => item.id), [1, 5]);
  assert.equal(updated[0].last_message_content, 'See you tomorrow!');
  assert.equal(original[1].last_message_content, conversation.last_message_content);
  assert.equal(updateConversationPreview(original, { conversation_id: 9, content: 'Hello', created_at: '' }), original);
});

test('relative day labels handle month and year boundaries and invalid dates safely', () => {
  const now = new Date(2026, 0, 1, 12);
  assert.equal(formatChatDate(new Date(2026, 0, 1, 8).toISOString(), now), 'Today');
  assert.equal(formatChatDate(new Date(2025, 11, 31, 23).toISOString(), now), 'Yesterday');
  assert.match(formatChatDate(new Date(2024, 11, 30, 12).toISOString(), now), /2024/);
  assert.equal(formatChatDate(null, now), '');
  assert.equal(formatChatDate('not a date', now), '');
  assert.equal(formatMessageTime('not a date'), '');
});

test('avatars handle whitespace and Unicode initials', () => {
  assert.equal(getInitials('  Ava  Cruz '), 'AC');
  assert.equal(getInitials('Élodie'), 'É');
  assert.equal(getInitials(''), '');
});
