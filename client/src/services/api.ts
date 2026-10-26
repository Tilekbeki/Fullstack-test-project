import type {
  Overview,
  Project,
  ProjectInput,
  ProjectQuery,
  Responsible,
  Task,
  TaskInput,
} from '../models/dashboard.type';
import { clearProjectPages, readProjectPage, writeProjectPage } from './projectPageCache';

const maxCacheEntries = 100;
const queryCache = new Map<string, { value?: unknown; pending?: Promise<unknown> }>();
type ProjectPage = { rows: Project[]; total: number };
type ProjectPageEvent =
  { type: 'updated'; page: ProjectPage } | { type: 'verified' | 'unavailable' };
const projectPageListeners = new Set<(event: ProjectPageEvent) => void>();
export const mutationStorageKey = 'adminka-data-mutation';
let cacheGeneration = 0;
let networkFirstGeneration = -1;
let persistenceQueue: Promise<void> = Promise.resolve();

function queuePersistence(operation: () => Promise<void>): Promise<void> {
  persistenceQueue = persistenceQueue.then(operation, operation).catch(() => {});
  return persistenceQueue;
}

function invalidateQueries(
  options: { preserveSavedPages?: boolean; networkFirst?: boolean } = {},
): Promise<void> {
  cacheGeneration++;
  networkFirstGeneration = options.networkFirst ? cacheGeneration : -1;
  queryCache.clear();
  return options.preserveSavedPages
    ? persistenceQueue
    : queuePersistence(clearProjectPages);
}

function isProjectPage(value: unknown): value is ProjectPage {
  if (!value || typeof value !== 'object') return false;
  const page = value as { rows?: unknown; total?: unknown };
  return (
    Array.isArray(page.rows) &&
    typeof page.total === 'number' &&
    Number.isSafeInteger(page.total) &&
    page.total >= 0
  );
}

async function revalidateProjectPage(
  path: string,
  cached: ProjectPage,
  entry: { value?: unknown },
  generation: number,
) {
  try {
    const fresh = await fetchResponse<ProjectPage>(path);
    if (generation !== cacheGeneration || queryCache.get(path) !== entry) return;
    entry.value = fresh;
    void queuePersistence(() => writeProjectPage(path, fresh));
    if (JSON.stringify(fresh) !== JSON.stringify(cached)) {
      for (const listener of projectPageListeners)
        listener({ type: 'updated', page: fresh });
    } else {
      for (const listener of projectPageListeners) listener({ type: 'verified' });
    }
  } catch {
    if (generation === cacheGeneration && queryCache.get(path) === entry) {
      for (const listener of projectPageListeners) listener({ type: 'unavailable' });
    }
  }
}

async function fetchResponse<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const detail =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : null;
    throw new Error(detail ?? `Ошибка запроса: ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function request<T>(path: string, options?: RequestInit): Promise<T> {
  if ((options?.method ?? 'GET').toUpperCase() !== 'GET') {
    return fetchResponse<T>(path, options).then(async (result) => {
      await invalidateQueries();
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            mutationStorageKey,
            `${Date.now()}-${Math.random()}`,
          );
        } catch {
          /* Storage may be disabled. */
        }
      }
      return result;
    });
  }

  const cached = queryCache.get(path);
  if (cached?.pending) return cached.pending as Promise<T>;
  if (cached) {
    queryCache.delete(path);
    queryCache.set(path, cached);
    return Promise.resolve(cached.value as T);
  }

  const generation = cacheGeneration;
  const entry: { value?: unknown; pending?: Promise<unknown> } = {};
  const pending = (async () => {
    await persistenceQueue;
    if (generation !== cacheGeneration || queryCache.get(path) !== entry)
      return request<T>(path, options);

    const isPageRequest = path.startsWith('/projects?');
    if (isPageRequest && networkFirstGeneration !== generation) {
      const saved = await readProjectPage<unknown>(path);
      if (generation !== cacheGeneration || queryCache.get(path) !== entry)
        return request<T>(path, options);
      if (isProjectPage(saved)) {
        entry.value = saved;
        delete entry.pending;
        void revalidateProjectPage(path, saved, entry, generation);
        return saved as T;
      }
    }

    let result: T;
    try {
      result = await fetchResponse<T>(path, options);
    } catch (error) {
      if (isPageRequest && networkFirstGeneration === generation) {
        const saved = await readProjectPage<unknown>(path);
        if (generation !== cacheGeneration || queryCache.get(path) !== entry)
          return request<T>(path, options);
        if (isProjectPage(saved)) {
          entry.value = saved;
          delete entry.pending;
          for (const listener of projectPageListeners) listener({ type: 'unavailable' });
          return saved as T;
        }
      }
      throw error;
    }
    if (generation !== cacheGeneration || queryCache.get(path) !== entry)
      return request<T>(path, options);
    entry.value = result;
    delete entry.pending;
    if (isPageRequest) {
      void queuePersistence(() => writeProjectPage(path, result));
      for (const listener of projectPageListeners) listener({ type: 'verified' });
    }
    if (queryCache.size > maxCacheEntries)
      queryCache.delete(queryCache.keys().next().value!);
    return result;
  })().catch((error) => {
    if (queryCache.get(path) === entry) queryCache.delete(path);
    throw error;
  });
  entry.pending = pending;
  queryCache.set(path, entry);
  return pending;
}

export const api = {
  invalidateQueries,
  onProjectPageEvent: (listener: (event: ProjectPageEvent) => void) => {
    projectPageListeners.add(listener);
    return () => {
      projectPageListeners.delete(listener);
    };
  },
  overview: () => request<Overview>('/overview'),
  responsibles: () => request<Responsible[]>('/responsibles'),
  createResponsible: (data: { name: string }) =>
    request<Responsible>('/responsibles', { method: 'POST', body: JSON.stringify(data) }),
  updateResponsible: (id: number, data: { name: string }) =>
    request<Responsible>(`/responsibles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteResponsible: (id: number) =>
    request<void>(`/responsibles/${id}`, { method: 'DELETE' }),
  projects: (offset: number, limit: number, filters: ProjectQuery) => {
    const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    return request<{ rows: Project[]; total: number }>(`/projects?${params}`);
  },
  createProject: (data: ProjectInput) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: ProjectInput) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  tasks: (projectId: number) => request<Task[]>(`/projects/${projectId}/tasks`),
  createTask: (projectId: number, data: TaskInput) =>
    request<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (projectId: number, id: number, data: TaskInput) =>
    request<Task>(`/projects/${projectId}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTask: (projectId: number, id: number) =>
    request<void>(`/projects/${projectId}/tasks/${id}`, { method: 'DELETE' }),
};
