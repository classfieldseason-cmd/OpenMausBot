import { useSyncExternalStore } from "react";

/** Show the bot's avatar beside its replies in a conversation. Off unless the person turns it on. */
export const CHAT_AVATAR_KEY = "omb-show-chat-avatars";

let sessionChoice: boolean | undefined;
const listeners = new Set<() => void>();

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function readChatAvatars(): boolean {
  if (sessionChoice !== undefined) return sessionChoice;
  try {
    return storage()?.getItem(CHAT_AVATAR_KEY) === "1";
  } catch {
    return false;
  }
}

function notify() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== CHAT_AVATAR_KEY && event.key !== null) return;
  if (event.storageArea && event.storageArea !== storage()) return;
  sessionChoice = undefined;
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function setChatAvatars(enabled: boolean): void {
  sessionChoice = enabled;
  try {
    storage()?.setItem(CHAT_AVATAR_KEY, enabled ? "1" : "0");
  } catch {
  }
  notify();
}

export function useChatAvatars(): boolean {
  return useSyncExternalStore(subscribe, readChatAvatars, readChatAvatars);
}
