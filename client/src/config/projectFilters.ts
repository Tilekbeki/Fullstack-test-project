import type { FilterKey } from '../models/dashboard.type';

export const filterLabels: Record<FilterKey, string> = {
  owner: 'Ответственный',
  priority: 'Приоритет',
  budgetMin: 'Бюджет от',
  budgetMax: 'Бюджет до',
  startFrom: 'Дата от',
  startTo: 'Дата до',
};

export const filterKeys = Object.keys(filterLabels) as FilterKey[];
