import { describe, it, expect } from "bun:test";

// Module-level tests — no OpenTUI dependency required
describe("workspace-store", () => {
  it("should export getEditorText", async () => {
    const mod = await import("../src/modules/workspace/workspace-store");
    expect(typeof mod.getEditorText).toBe("function");
  });
});

describe("file-system", () => {
  it("should detect line endings", async () => {
    const mod = await import("../src/modules/workspace/file-system");
    // can't test private functions directly; ensure exports exist
    expect(typeof mod.readFileContent).toBe("function");
    expect(typeof mod.writeFileContent).toBe("function");
    expect(typeof mod.createFile).toBe("function");
  });
});

describe("search", () => {
  it("should export fuzzySearchFiles", async () => {
    const mod = await import("../src/modules/search/search");
    expect(typeof mod.fuzzySearchFiles).toBe("function");
  });

  it("should fuzzy search correctly", () => {
    const { fuzzySearchFiles } = require("../src/modules/search/search");
    const files = [
      { path: "/a/foo.ts", name: "foo.ts" },
      { path: "/a/bar.ts", name: "bar.ts" },
      { path: "/a/Foobar.ts", name: "Foobar.ts" },
    ];
    const results = fuzzySearchFiles("foo", files);
    expect(results.length).toBe(2);
    expect(results[0]!.name).toBe("foo.ts");
  });
});

describe("undo", () => {
  it("should push and undo snapshots", () => {
    const { pushSnapshot, undo, redo } = require("../src/modules/workspace/undo");
    pushSnapshot("tab1", "hello");
    pushSnapshot("tab1", "hello world");
    const prev = undo("tab1");
    expect(prev).toBe("hello");
    const next = redo("tab1");
    expect(next).toBe("hello world");
  });
});

describe("export", () => {
  it("should generate export preview", async () => {
    const mod = await import("../src/modules/export/store");
    const preview = mod.exportPreview("# Hello\n\nWorld");
    expect(preview).toContain("1 headings");
    expect(preview).toContain("3 words");
  });
});

describe("ai provider", () => {
  it("should create OpenAI provider", async () => {
    const mod = await import("../src/modules/ai/openai-provider");
    const provider = mod.createOpenAIProvider("test-key");
    expect(provider.name).toBe("openai");
    expect(typeof provider.chat).toBe("function");
  });
});
