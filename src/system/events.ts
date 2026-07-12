type EventMap = {
  "module:registered": { key: string };
  "tab:opened": { filePath: string };
  "tab:closed": { filePath: string };
  "file:changed": { filePath: string };
  "file:saved": { filePath: string };
  "mode:changed": { mode: string };
  "workspace:opened": { rootPath: string };
  "session:restored": {};
  "recent:updated": {};
  "git:status-changed": {};
  "search:executed": { query: string };
  "focus:changed": { paneId: string | null };
  "theme:changed": { theme: string };
  "preview:toggle": {};
};

type EventCallback<T> = (data: T) => void;

class EventBus {
  private listeners = new Map<string, Set<EventCallback<any>>>();

  on<K extends keyof EventMap>(event: K, cb: EventCallback<EventMap[K]>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(cb);
    this.listeners.set(event, set);
    return () => set.delete(cb);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

export const bus = new EventBus();
