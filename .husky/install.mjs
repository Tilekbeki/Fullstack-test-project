import { existsSync } from 'node:fs';

if (existsSync('.git')) {
  const husky = (await import('husky')).default;
  husky();
}
