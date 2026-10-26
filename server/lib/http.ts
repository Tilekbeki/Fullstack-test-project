import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

export function positiveInt(value: unknown, label: string): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > 2_147_483_647) {
    throw new HttpError(
      400,
      `${label} должен быть положительным целым числом до 2147483647`,
    );
  }
  return n;
}

export function paging(query: Request['query']): { limit: number; offset: number } {
  const limit = query.limit === undefined ? 20 : positiveInt(query.limit, 'limit');
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (limit > 100 || !Number.isSafeInteger(offset) || offset < 0) {
    throw new HttpError(400, 'Допустимы limit от 1 до 100 и offset от 0');
  }
  return { limit, offset };
}

export function text(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new HttpError(400, `${label}: требуется строка до ${maxLength} символов`);
  }
  return value.trim();
}

export function nonNegative(value: unknown, label: string): number {
  const n = Number(value);
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    !Number.isFinite(n) ||
    n < 0
  ) {
    throw new HttpError(400, `${label} должен быть неотрицательным числом`);
  }
  return n;
}

export function decimal(
  value: unknown,
  label: string,
  integerDigits: number,
  fractionDigits: number,
): string {
  const input =
    typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  if (
    typeof input !== 'string' ||
    !new RegExp(
      `^(?:0|[1-9]\\d{0,${integerDigits - 1}})(?:\\.\\d{1,${fractionDigits}})?$`,
    ).test(input)
  ) {
    throw new HttpError(
      400,
      `${label} должен быть неотрицательным числом: до ${integerDigits} цифр до запятой и ${fractionDigits} после`,
    );
  }
  return input;
}

export function isoDate(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith('0000-') ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new HttpError(400, `${label} должен быть датой YYYY-MM-DD`);
  }
  return value;
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Ожидается объект JSON');
  }
  return value as Record<string, unknown>;
}

export function rangeInt(
  value: unknown,
  label: string,
  min: number,
  max: number,
): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${label} должен быть числом от ${min} до ${max}`);
  }
  return n;
}
