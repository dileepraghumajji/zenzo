// ─── Attendance offline IndexedDB store ───────────────────────────────────────
//
// Used by TakeAttendanceClient to:
//   1. Persist a draft of the current session on every toggle (survives refreshes)
//   2. Queue a failed save so it can be retried when connectivity returns
//
// Store layout (IndexedDB):
//   DB name:    "zenzo-attendance"
//   Version:    1
//   Store:      "sessions"
//     key:      "{batchId}-{date}"    (e.g. "abc123-2026-04-10")
//     value:    SessionRecord (see below)
//
// Two record types share the same store:
//   type: "draft"   — saved automatically on every status change
//   type: "queued"  — a failed save that should be retried

export type AttendanceRecord = {
  membership_id: string;
  status: string;
  is_drop_in: boolean;
};

export type SessionRecord = {
  key: string;         // "{batchId}-{date}"
  batchId: string;
  date: string;
  clubSlug: string;
  records: AttendanceRecord[];
  type: "draft" | "queued";
  savedAt: number;     // Date.now()
};

const DB_NAME    = "zenzo-attendance";
const STORE_NAME = "sessions";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function sessionKey(batchId: string, date: string): string {
  return `${batchId}-${date}`;
}

/** Save or update a draft record for this session. */
export async function saveDraft(
  batchId: string,
  date: string,
  clubSlug: string,
  records: AttendanceRecord[]
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: SessionRecord = {
      key:     sessionKey(batchId, date),
      batchId,
      date,
      clubSlug,
      records,
      type:    "draft",
      savedAt: Date.now(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** Promote a draft to a queued record (called when the network save fails). */
export async function queueForSync(
  batchId: string,
  date: string,
  clubSlug: string,
  records: AttendanceRecord[]
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: SessionRecord = {
      key:     sessionKey(batchId, date),
      batchId,
      date,
      clubSlug,
      records,
      type:    "queued",
      savedAt: Date.now(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** Load a stored session (draft or queued) — returns null if none exists. */
export async function loadSession(
  batchId: string,
  date: string
): Promise<SessionRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get(sessionKey(batchId, date));
    req.onsuccess = () => resolve((req.result as SessionRecord) ?? null);
    req.onerror   = () => reject(req.error);
  });
}

/** Remove a session after a successful sync. */
export async function clearSession(
  batchId: string,
  date: string
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(sessionKey(batchId, date));
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/** Return all sessions with type = "queued" (for the sync-on-reconnect loop). */
export async function getAllQueued(): Promise<SessionRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE_NAME, "readonly");
    const store   = tx.objectStore(STORE_NAME);
    const req     = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as SessionRecord[]) ?? [];
      resolve(all.filter((r) => r.type === "queued"));
    };
    req.onerror = () => reject(req.error);
  });
}
