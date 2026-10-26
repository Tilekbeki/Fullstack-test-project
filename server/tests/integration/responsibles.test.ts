import assert from 'node:assert/strict';
import test from 'node:test';

const base = process.env.TEST_API_URL?.replace(/\/$/, '');

interface ApiResult<T = unknown> {
  status: number;
  data: T;
}

async function request<T>(
  path: string,
  method = 'GET',
  body?: object,
): Promise<ApiResult<T>> {
  if (!base) throw new Error('Задайте TEST_API_URL для интеграционного теста');
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? undefined : await response.json();
  return { status: response.status, data: data as T };
}

test(
  'responsibles CRUD keeps project references valid',
  { skip: !base && 'Set TEST_API_URL to run this test' },
  async () => {
    const uniqueName = `Проверка ответственного ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let responsibleId: number | undefined;
    let projectId: number | undefined;

    try {
      const invalid = await request<{ error: string }>('/responsibles', 'POST', {
        name: '  ',
      });
      assert.equal(invalid.status, 400);

      const created = await request<{ id: number; name: string }>(
        '/responsibles',
        'POST',
        { name: `  ${uniqueName}  ` },
      );
      assert.equal(created.status, 201);
      responsibleId = created.data.id;
      assert.equal(created.data.name, uniqueName);

      const listed = await request<Array<{ id: number; name: string }>>('/responsibles');
      assert.equal(listed.status, 200);
      assert.ok(
        listed.data.some((item) => item.id === responsibleId && item.name === uniqueName),
      );

      const duplicate = await request<{ error: string }>('/responsibles', 'POST', {
        name: uniqueName,
      });
      assert.equal(duplicate.status, 409);

      const project = await request<{
        id: number;
        owner_id: number;
        owner: string;
        start_date: string;
      }>('/projects', 'POST', {
        name: `Проверочный проект ${uniqueName}`,
        owner_id: responsibleId,
        budget: '100',
        start_date: '2026-10-25',
        priority: 1,
      });
      assert.equal(project.status, 201);
      projectId = project.data.id;
      assert.equal(project.data.owner_id, responsibleId);
      assert.equal(project.data.owner, uniqueName);
      assert.equal(project.data.start_date, '2026-10-25');

      const linkedTask = await request<{ id: number; due_date: string }>(
        `/projects/${projectId}/tasks`,
        'POST',
        {
          title: 'Проверка даты',
          assignee: uniqueName,
          estimate: '2',
          due_date: '2026-10-26',
          status_code: 1,
        },
      );
      assert.equal(linkedTask.status, 201);
      assert.equal(linkedTask.data.due_date, '2026-10-26');

      const wrongParent = projectId + 1;
      const wrongUpdate = await request<{ error: string }>(
        `/projects/${wrongParent}/tasks/${linkedTask.data.id}`,
        'PUT',
        {
          title: 'Неверный проект',
          assignee: uniqueName,
          estimate: '2',
          due_date: '2026-10-26',
          status_code: 1,
        },
      );
      assert.equal(wrongUpdate.status, 404);
      const wrongDelete = await request<{ error: string }>(
        `/projects/${wrongParent}/tasks/${linkedTask.data.id}`,
        'DELETE',
      );
      assert.equal(wrongDelete.status, 404);

      const invalidBudget = await request<{ error: string }>('/projects', 'POST', {
        name: 'Слишком большой бюджет',
        owner_id: responsibleId,
        budget: '10000000000',
        start_date: '2026-10-25',
        priority: 1,
      });
      assert.equal(invalidBudget.status, 400);

      const invalidEstimate = await request<{ error: string }>(
        `/projects/${projectId}/tasks`,
        'POST',
        {
          title: 'Слишком много часов',
          assignee: uniqueName,
          estimate: '10000000',
          due_date: '2026-10-26',
          status_code: 1,
        },
      );
      assert.equal(invalidEstimate.status, 400);

      const renamedName = `${uniqueName} новый`;
      const renamed = await request<{ id: number; name: string }>(
        `/responsibles/${responsibleId}`,
        'PUT',
        { name: renamedName },
      );
      assert.equal(renamed.status, 200);
      assert.equal(renamed.data.name, renamedName);

      const linkedProject = await request<{ owner_id: number; owner: string }>(
        `/projects/${projectId}`,
      );
      assert.equal(linkedProject.status, 200);
      assert.equal(linkedProject.data.owner_id, responsibleId);
      assert.equal(linkedProject.data.owner, renamedName);

      const linkedDelete = await request<{ error: string }>(
        `/responsibles/${responsibleId}`,
        'DELETE',
      );
      assert.equal(linkedDelete.status, 409);
      assert.match(linkedDelete.data.error, /назначен проектам/);

      const missingOwner = await request<{ error: string }>('/projects', 'POST', {
        name: 'Проект с неверным ответственным',
        owner_id: 999999999,
        budget: '100',
        start_date: '2026-10-25',
        priority: 1,
      });
      assert.equal(missingOwner.status, 400);
      assert.match(missingOwner.data.error, /Ответственный не найден/);

      const nameInsteadOfId = await request<{ error: string }>('/projects', 'POST', {
        name: 'Проект без выбора',
        owner: uniqueName,
        budget: '100',
        start_date: '2026-10-25',
        priority: 1,
      });
      assert.equal(nameInsteadOfId.status, 400);
    } finally {
      if (projectId !== undefined) {
        const removed = await request(`/projects/${projectId}`, 'DELETE');
        assert.equal(removed.status, 204);
      }
      if (responsibleId !== undefined) {
        const removed = await request(`/responsibles/${responsibleId}`, 'DELETE');
        assert.equal(removed.status, 204);
      }
    }
  },
);
