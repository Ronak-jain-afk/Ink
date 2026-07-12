import { h, TextareaRenderable } from "@opentui/core";
import type { TextareaOptions } from "@opentui/core";
import { bus } from "../system/events";

export function createEditor(text: string) {
  const editor = h(TextareaRenderable, {
    initialValue: text,
    flexGrow: 1,
    wrapMode: "char",
  } satisfies TextareaOptions as any);

  return {
    node: editor,
    setText: (t: string) => { (editor as any).setText(t); },
    getText: () => (editor as any).plainText as string,
    focus: () => (editor as any).focus(),
  };
}
