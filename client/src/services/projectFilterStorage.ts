import type { FilterKey, ProjectQuery } from '../models/dashboard.type';
import { filterKeys } from '../config/projectFilters';

const filterStorageKey = 'workboard-project-filters-v1';

export function loadProjectFilters(): { query: ProjectQuery; active: FilterKey[] } {
  try {
    const saved = JSON.parse(localStorage.getItem(filterStorageKey) ?? '{}');
    const query: ProjectQuery = {
      search: typeof saved.query?.search === 'string' ? saved.query.search : '',
    };
    const active = Array.isArray(saved.active)
      ? filterKeys.filter((key) => saved.active.includes(key))
      : [];
    for (const key of active)
      if (typeof saved.query?.[key] === 'string') query[key] = saved.query[key];
    return { query, active };
  } catch {
    return { query: { search: '' }, active: [] };
  }
}

export function saveProjectFilters(filters: {
  query: ProjectQuery;
  active: FilterKey[];
}): void {
  if (!filters.query.search && !filters.active.length)
    localStorage.removeItem(filterStorageKey);
  else localStorage.setItem(filterStorageKey, JSON.stringify(filters));
}
