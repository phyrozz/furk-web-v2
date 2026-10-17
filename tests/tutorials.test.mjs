import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Load only the static catalog. Never import the application or its API clients.
const source = await readFile(new URL('../src/data/tutorials.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
});
const { tutorials, tutorialVideoFiles, getTutorialsForAudience, getTutorialAudienceForPage, getSuggestedTutorials, getTutorialVideoUrl } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('each audience has unique, actionable guides with written instructions', () => {
  assert.equal(new Set(tutorials.map(({ id }) => id)).size, tutorials.length);
  for (const audience of ['pet-owner', 'merchant']) {
    const available = getTutorialsForAudience(audience);
    assert.equal(available.length, 6);
    for (const tutorial of available) {
      assert.ok(tutorial.title && tutorial.description);
      assert.ok(tutorial.steps.length >= 3);
      assert.ok(tutorial.relatedPaths.length > 0);
      assert.ok(tutorial.action.to.startsWith('/'));
      assert.equal(tutorial.action.to.startsWith('/merchant/'), audience === 'merchant');
    }
  }
});

test('suggestions prioritize the current page, including nested routes', () => {
  assert.equal(getSuggestedTutorials('pet-owner', '/services/42')[0].id, 'book-service');
  assert.equal(getSuggestedTutorials('merchant', '/merchant/bookings')[0].id, 'manage-bookings');
  assert.equal(getSuggestedTutorials('merchant', '/merchant/edit-service/42')[0].id, 'manage-services');
  assert.equal(getSuggestedTutorials('merchant', '/merchant/payouts')[0].id, 'merchant-earnings');
});

test('bubbles appear for the appropriate audience on relevant pages', () => {
  assert.equal(getTutorialAudienceForPage('/', false, null), 'pet-owner');
  assert.equal(getTutorialAudienceForPage('/services/42', false, null), 'pet-owner');
  assert.equal(getTutorialAudienceForPage('/profile', true, 'user'), 'pet-owner');
  assert.equal(getTutorialAudienceForPage('/merchant/bookings', true, 'merchant'), 'merchant');
  assert.equal(getTutorialAudienceForPage('/help', true, 'merchant'), 'merchant');
  assert.equal(getTutorialAudienceForPage('/merchant/bookings', false, null), null);
  assert.equal(getTutorialAudienceForPage('/merchant/bookings', true, 'user'), null);
});

test('bubbles stay off payment, chat, authentication, and other roles’ screens', () => {
  for (const path of ['/payment', '/payment/success', '/payment/failed', '/chat', '/chat/42', '/merchant/chat', '/merchant/chat/42', '/login', '/sign-up/user', '/reset-password', '/admin/dashboard', '/affiliate/dashboard', '/terms-of-service', '/services-unrelated']) {
    for (const role of ['user', 'merchant', null]) {
      assert.equal(getTutorialAudienceForPage(path, Boolean(role), role), null, `${role}: ${path}`);
    }
  }
  for (const role of ['admin', 'affiliate']) {
    assert.equal(getTutorialAudienceForPage('/help', true, role), null);
    assert.equal(getTutorialAudienceForPage('/', true, role), null);
  }
});

test('suggestions stay within the audience and contain three distinct topics', () => {
  for (const audience of ['pet-owner', 'merchant']) {
    for (const path of ['/', '/profile', '/help', '/merchant/dashboard', '/services/42']) {
      const suggestions = getSuggestedTutorials(audience, path);
      assert.equal(suggestions.length, 3);
      assert.equal(new Set(suggestions.map(({ id }) => id)).size, 3);
      assert.ok(suggestions.every((tutorial) => tutorial.audience === audience));
    }
  }
});

test('unrecorded topics never produce a video URL', () => {
  for (const tutorial of tutorials) {
    if (!tutorialVideoFiles[tutorial.id]) assert.equal(getTutorialVideoUrl(tutorial.id, 'https://example.invalid'), undefined);
  }
});

test('recorded videos require a CDN and preserve nested, encoded S3 keys', () => {
  const original = tutorialVideoFiles['book-service'];
  tutorialVideoFiles['book-service'] = 'pet-owner/book service.mp4';
  try {
    assert.equal(getTutorialVideoUrl('book-service', undefined), undefined);
    assert.equal(getTutorialVideoUrl('book-service', '   '), undefined);
    assert.equal(getTutorialVideoUrl('book-service', ' https://example.invalid/media/// '), 'https://example.invalid/media/tutorials/pet-owner/book%20service.mp4');
  } finally {
    if (original === undefined) delete tutorialVideoFiles['book-service'];
    else tutorialVideoFiles['book-service'] = original;
  }
});

test('the rewards guide accurately discloses that redemption is unavailable', () => {
  const rewards = tutorials.find(({ id }) => id === 'furkoins-and-rewards');
  assert.match(rewards.tip, /redemption is not available yet/);
});
