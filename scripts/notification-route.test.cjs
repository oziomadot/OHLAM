const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/notificationRoute.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
new Function('exports', code)(exportsObject);
const { notificationRoute } = exportsObject;
test('opens the particular appointment and property transaction', () => {
 assert.equal(notificationRoute({route:'/appointment/8'}), '/(tabs)/appointment/8');
 assert.equal(notificationRoute({route:'/property-payment/transaction/11'}), '/(tabs)/property-payment/transaction/11');
 assert.equal(notificationRoute({route:'/(tabs)/wallet/referral-rewards'}), '/(tabs)/wallet/referral-rewards');
});
test('opens chat using either notification type field', () => {
 assert.equal(notificationRoute({notification_type:'chat_message',conversation_id:9}), '/(tabs)/chat/9');
});
test('rejects external URLs, API actions, traversal and malformed IDs', () => {
 for (const route of ['https://example.com','/api/properties/1/delete-vote','/appointment/../auth','//evil.com','/appointment/8?redirect=evil']) {
  assert.equal(notificationRoute({route}), '/(tabs)/dashboard/notifications');
 }
 assert.equal(notificationRoute({type:'chat_message',conversation_id:'../1'}), '/(tabs)/dashboard/notifications');
});
test('opens delegation and beneficiary screens with appointment context', () => {
 for (const route of ['/appointment/representative/view?appointmentId=8','/property-payment/lister/add-beneficiary?appointmentId=8']) {
  assert.equal(notificationRoute({route}), `/(tabs)${route}`);
 }
});
