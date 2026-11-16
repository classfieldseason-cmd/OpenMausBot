import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hook = vi.hoisted(() => ({
  snapshot: undefined as undefined | (() => boolean),
}));

vi.mock("react", () => ({
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => boolean) => {
    hook.snapshot = snapshot;
    return snapshot();
  },
}));

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

let local: ReturnType<typeof memoryStorage>;

beforeEach(() => {
  vi.resetModules();
  local = memoryStorage();
  vi.stubGlobal("localStorage", local);
  vi.stubGlobal("window", new EventTarget());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bot avatars in chat", () => {
  it("is off until the person turns it on", async () => {
    const preference = await import("./chat-avatar-preference");
    expect(preference.readChatAvatars()).toBe(false);
    expect(preference.useChatAvatars()).toBe(false);
    local.setItem(preference.CHAT_AVATAR_KEY, "1");
    expect(preference.readChatAvatars()).toBe(true);
    local.setItem(preference.CHAT_AVATAR_KEY, "0");
    expect(preference.readChatAvatars()).toBe(false);
  });

  it("stays off when this device's storage cannot be read", async () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => {} });
    const preference = await import("./chat-avatar-preference");
    expect(preference.readChatAvatars()).toBe(false);
  });

  it("remembers the choice on this device", async () => {
    let preference = await import("./chat-avatar-preference");
    preference.setChatAvatars(true);
    expect(local.getItem(preference.CHAT_AVATAR_KEY)).toBe("1");
    vi.resetModules();
    preference = await import("./chat-avatar-preference");
    expect(preference.readChatAvatars()).toBe(true);
    preference.setChatAvatars(false);
    expect(local.getItem(preference.CHAT_AVATAR_KEY)).toBe("0");
    expect(preference.readChatAvatars()).toBe(false);
  });
});
