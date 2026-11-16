import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Bot, InstanceInfo } from "@/state/store";

const fixture = vi.hoisted(() => ({ avatars: false }));

vi.mock("@/state/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/state/store")>();
  return { ...original, useStore: () => ({ state: { ...original.initialState, instances: [{ instanceId: "test", driverKind: "codex", displayName: "Test" } as InstanceInfo] }, dispatch: vi.fn() }) };
});
vi.mock("./DesktopCapabilities", () => ({
  useDesktopCapabilities: () => ({ capabilities: { dictation: { available: false }, host: { packaged: true, platform: "other" }, localComputer: { available: false, reasonCode: "x", message: "" } }, ready: true }),
  useCaptionChrome: () => ({}),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/thread-preferences", () => ({ useShowThreads: () => false, useShowThreadsChoice: () => false, setShowThreads: vi.fn() }));
vi.mock("@/lib/interface-mode", () => ({ useAdvancedMode: () => false, setAdvancedMode: vi.fn() }));
vi.mock("@/lib/cloud-guest", () => ({ useCanWriteIn: () => true, useReactor: () => "user" }));
vi.mock("./CitationUI", () => ({ CitationSelectionToolbar: () => null, SentCitations: () => null }));
vi.mock("./ModelPicker", () => ({ ModelPicker: () => null }));
vi.mock("./ApprovalModeSelector", () => ({ ApprovalModeSelector: () => null }));
vi.mock("@/lib/chat-avatar-preference", () => ({ useChatAvatars: () => fixture.avatars }));

const { ChatView } = await import("./ChatView");

const bot: Bot = {
  id: "bot", threadId: "selected", name: "Sample", title: "", description: "", color: "yellow",
  notifications: true, unread: false, busy: false, messages: [
    { id: "u", role: "user", kind: "text", at: 1, text: "hello from me" },
    { id: "b", role: "bot", kind: "text", at: 2, text: "hello back" },
    { id: "b2", role: "bot", kind: "text", at: 3, text: "a second reply" },
  ],
  modelSelection: { instanceId: "test", model: "profile-default" },
  tasks: [{ threadId: "selected", title: "Selected", createdAt: 1, busy: false, activity: "idle", modelSelection: { instanceId: "test", model: "thread-model" }, approvalMode: "ask" }],
};

const avatars = (html: string) => html.match(/data-chat-avatar/g)?.length ?? 0;

afterEach(() => { fixture.avatars = false; vi.unstubAllGlobals(); });

beforeEach(() => {
  vi.stubGlobal("window", {});
});

describe("bot avatar in the chat corner", () => {
  it("draws no avatar while the setting is off", () => {
    const html = renderToStaticMarkup(createElement(ChatView, { bot }));
    expect(html).toContain("hello back");
    expect(avatars(html)).toBe(0);
  });

  it("draws the bot's avatar above the bottom-left corner when the setting is on", () => {
    fixture.avatars = true;
    const html = renderToStaticMarkup(createElement(ChatView, { bot }));
    expect(avatars(html)).toBe(1);
    expect(html).toContain("pointer-events-none absolute left-4");
    // composerDock falls back to 64px before layout, plus the 16px offset from the bottom.
    expect(html).toContain("bottom:80px");
  });
});
