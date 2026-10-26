const databaseName = 'adminka-project-cache-v3';
const storeName = 'pages';
const maxPages = 100;

interface StoredPage<T> {
  path: string;
  value: T;
  savedAt: number;
}

let databasePromise: Promise<IDBDatabase | null> | undefined;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!databasePromise) {
    databasePromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(databaseName, 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore(storeName, { keyPath: 'path' });
        request.onsuccess = () => {
          request.result.onversionchange = () => {
            request.result.close();
            databasePromise = undefined;
          };
          resolve(request.result);
        };
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return databasePromise;
}

export async function readProjectPage<T>(path: string): Promise<T | undefined> {
  const database = await openDatabase();
  if (!database) return undefined;
  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).get(path);
      request.onsuccess = () =>
        resolve((request.result as StoredPage<T> | undefined)?.value);
      request.onerror = () => resolve(undefined);
      transaction.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

export async function writeProjectPage<T>(path: string, value: T): Promise<void> {
  const database = await openDatabase();
  if (!database) return;
  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put({ path, value, savedAt: Date.now() } satisfies StoredPage<T>);
      const all = store.getAll();
      all.onsuccess = () => {
        const pages = (all.result as StoredPage<T>[]).sort(
          (a, b) => a.savedAt - b.savedAt,
        );
        for (const page of pages.slice(0, Math.max(0, pages.length - maxPages)))
          store.delete(page.path);
      };
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => resolve();
      transaction.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function clearProjectPages(): Promise<void> {
  const database = await openDatabase();
  if (!database) return;
  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).clear();
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => resolve();
      transaction.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
