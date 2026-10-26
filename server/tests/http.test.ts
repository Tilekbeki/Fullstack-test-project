import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HttpError,
  decimal,
  paging,
  positiveInt,
  isoDate,
  rangeInt,
  record,
} from '../lib/http';

test('pagination accepts AG Grid ranges and rejects invalid input', () => {
  assert.deepEqual(paging({ limit: '20', offset: '40' }), { limit: 20, offset: 40 });
  assert.deepEqual(paging({}), { limit: 20, offset: 0 });
  assert.throws(() => paging({ limit: '101' }), HttpError);
  assert.throws(() => paging({ offset: '-1' }), HttpError);
  assert.throws(() => paging({ limit: 'abc' }), HttpError);
});

test('identifier, date and status validation', () => {
  assert.equal(positiveInt('7', 'id'), 7);
  assert.throws(() => positiveInt('0', 'id'), HttpError);
  assert.throws(() => positiveInt('2147483648', 'id'), HttpError);
  assert.equal(isoDate('2026-10-20', 'date'), '2026-10-20');
  assert.throws(() => isoDate('tomorrow', 'date'), HttpError);
  assert.throws(() => isoDate('2026-02-30', 'date'), HttpError);
  assert.throws(() => isoDate('0000-01-01', 'date'), HttpError);
  assert.equal(rangeInt('3', 'status', 1, 3), 3);
  assert.throws(() => rangeInt(4, 'status', 1, 3), HttpError);
  assert.throws(() => record(null), HttpError);
});

test('decimal values fit the database column precision', () => {
  assert.equal(decimal('9999999999.99', 'Бюджет', 10, 2), '9999999999.99');
  assert.equal(decimal('9999999.9', 'Оценка', 7, 1), '9999999.9');
  assert.throws(() => decimal('10000000000', 'Бюджет', 10, 2), HttpError);
  assert.throws(() => decimal('1.234', 'Бюджет', 10, 2), HttpError);
  assert.throws(() => decimal('10000000', 'Оценка', 7, 1), HttpError);
  assert.throws(() => decimal('-1', 'Оценка', 7, 1), HttpError);
});
