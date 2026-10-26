import type { ColDef } from 'ag-grid-community';
import type { Project, Task } from '../models/dashboard.type';
import { formatDate } from '../utils/date';
import { money, priorities, statuses } from '../utils/presentation';

export const projectColumns: ColDef<Project>[] = [
  { field: 'id', headerName: 'ID', width: 78 },
  { field: 'name', headerName: 'Проект', flex: 2, minWidth: 200 },
  { field: 'owner', headerName: 'Ответственный', flex: 1.4, minWidth: 170 },
  {
    field: 'budget',
    headerName: 'Бюджет',
    valueFormatter: (p) => money(p.value ?? 0),
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'start_date',
    headerName: 'Старт',
    valueFormatter: (p) => (p.value ? formatDate(p.value) : ''),
    width: 130,
  },
  {
    field: 'priority',
    headerName: 'Приоритет',
    valueFormatter: (p) => priorities[Number(p.value) - 1],
    width: 130,
  },
];
export const taskColumns: ColDef<Task>[] = [
  { field: 'id', headerName: 'ID', width: 76 },
  { field: 'title', headerName: 'Задача', flex: 2, minWidth: 180 },
  { field: 'assignee', headerName: 'Исполнитель', flex: 1.4, minWidth: 170 },
  { field: 'estimate', headerName: 'Часы', width: 95 },
  {
    field: 'due_date',
    headerName: 'Срок',
    valueFormatter: (p) => (p.value ? formatDate(p.value) : ''),
    width: 120,
  },
  {
    field: 'status_code',
    headerName: 'Статус',
    valueFormatter: (p) => statuses[Number(p.value) - 1],
    width: 120,
  },
];
