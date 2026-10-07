import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { handler } from './chat.js';

const originalFetch = globalThis.fetch;
const originalKey = process.env.GEMINI_API_KEY;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
});
const event = body => ({ httpMethod: 'POST', body: JSON.stringify(body) });

test('forwards conversational context, mode and style while excluding thought parts', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  let request;
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ thought: true, text: 'internal' }, { text: 'Hola, ' }, { text: 'Ana.' }] } }] }));
  };
  const result = await handler(event({ message: '¿Cómo me llamo?', history: [{ role: 'user', content: 'Me llamo Ana' }, { role: 'ai', content: 'Hola' }], mode: 'code', style: 'concise' }));
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).text, 'Hola, Ana.');
  assert.deepEqual(request.contents.map(turn => turn.role), ['user', 'model', 'user']);
  assert.equal(request.contents[0].parts[0].text, 'Me llamo Ana');
  assert.match(request.systemInstruction.parts[0].text, /programar/);
  assert.match(request.systemInstruction.parts[0].text, /breve/);
});

test('returns a real retryable error for provider rate limits', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  globalThis.fetch = async () => new Response('{}', { status: 429 });
  const result = await handler(event({ message: 'Hola' }));
  assert.equal(result.statusCode, 429);
  assert.ok(JSON.parse(result.body).error);
  assert.equal(JSON.parse(result.body).text, undefined);
});

test('rejects invalid input before making a provider request', async () => {
  globalThis.fetch = async () => { throw new Error('Should not be called'); };
  assert.equal((await handler({ httpMethod: 'GET' })).statusCode, 405);
  assert.equal((await handler({ httpMethod: 'POST', body: '{invalid' })).statusCode, 400);
  for (const message of ['', ' ', 123, 'x'.repeat(12001)]) assert.equal((await handler(event({ message }))).statusCode, 400);
});

test('does not report a successful response when the provider returns no text', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  globalThis.fetch = async () => new Response(JSON.stringify({ candidates: [] }));
  assert.equal((await handler(event({ message: 'Hola' }))).statusCode, 502);
});
