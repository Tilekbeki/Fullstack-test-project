export const money = (value: string | number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value));
export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось выполнить запрос';
export const priorities = ['Низкий', 'Средний', 'Высокий'];
export const statuses = ['Новая', 'В работе', 'Готово'];
