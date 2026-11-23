type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** Đọc khóa mới. Nếu chưa có, chép khóa cũ sang rồi xóa khóa cũ. */
export function migrateStorageValue(store: KeyValueStore, nextKey: string, legacyKey: string) {
  const current = store.getItem(nextKey);
  if (current) return current;
  const legacy = store.getItem(legacyKey);
  if (!legacy) return null;
  store.setItem(nextKey, legacy);
  store.removeItem(legacyKey);
  return legacy;
}
