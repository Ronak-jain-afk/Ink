let abortController: AbortController | null = null;

export function createCancellationToken(): AbortController {
  abortController?.abort();
  abortController = new AbortController();
  return abortController;
}

export function cancelCurrentRequest(): void {
  abortController?.abort();
  abortController = null;
}

export function getSignal(): AbortSignal | null {
  return abortController?.signal ?? null;
}
