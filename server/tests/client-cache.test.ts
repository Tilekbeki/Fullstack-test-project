import assert from 'node:assert/strict';
import test from 'node:test';
import { api } from '../../client/src/services/api';

test('GET requests share in-flight work and refresh after explicit invalidation or a write', async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input, options) => {
    const path = String(input);
    requests.push(`${options?.method ?? 'GET'} ${path}`);
    if (options?.method === 'POST')
      return new Response(JSON.stringify({ id: 1 }), { status: 201 });
    return new Response(JSON.stringify([{ id: 1, name: 'Анна' }]), { status: 200 });
  };

  try {
    api.invalidateQueries();
    const [first, second] = await Promise.all([api.responsibles(), api.responsibles()]);
    assert.deepEqual(first, [{ id: 1, name: 'Анна' }]);
    assert.deepEqual(second, [{ id: 1, name: 'Анна' }]);
    await api.responsibles();
    assert.deepEqual(requests, ['GET /api/responsibles']);

    api.invalidateQueries();
    await api.responsibles();
    assert.deepEqual(requests, ['GET /api/responsibles', 'GET /api/responsibles']);

    await api.createProject({
      name: 'Проект',
      owner_id: 1,
      budget: '100',
      start_date: '2026-10-25',
      priority: 1,
    });
    await api.responsibles();
    assert.deepEqual(requests, [
      'GET /api/responsibles',
      'GET /api/responsibles',
      'POST /api/projects',
      'GET /api/responsibles',
    ]);
  } finally {
    api.invalidateQueries();
    globalThis.fetch = originalFetch;
  }
});

test('an old in-flight response cannot restore stale data after invalidation', async () => {
  const originalFetch = globalThis.fetch;
  let finishOldRequest!: (response: Response) => void;
  let signalFirstRequest!: () => void;
  const firstRequestStarted = new Promise<void>((resolve) => {
    signalFirstRequest = resolve;
  });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1)
      return new Promise<Response>((resolve) => {
        finishOldRequest = resolve;
        signalFirstRequest();
      });
    return new Response(JSON.stringify([{ id: 2, name: 'Новое имя' }]), { status: 200 });
  };

  try {
    api.invalidateQueries();
    const oldRead = api.responsibles();
    await firstRequestStarted;
    api.invalidateQueries();
    const freshRead = api.responsibles();
    finishOldRequest(
      new Response(JSON.stringify([{ id: 1, name: 'Старое имя' }]), { status: 200 }),
    );
    assert.deepEqual(await freshRead, [{ id: 2, name: 'Новое имя' }]);
    assert.deepEqual(await oldRead, [{ id: 2, name: 'Новое имя' }]);
    assert.equal(calls, 2);
  } finally {
    api.invalidateQueries();
    globalThis.fetch = originalFetch;
  }
});

test('a malformed error response still produces a readable request error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('null', {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    await api.invalidateQueries();
    await assert.rejects(api.responsibles(), /Ошибка запроса: 500/);
  } finally {
    await api.invalidateQueries();
    globalThis.fetch = originalFetch;
  }
});
