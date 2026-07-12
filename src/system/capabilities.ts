export interface TerminalCapabilityProfile {
  trueColor: boolean;
  unicode: boolean;
  imageProtocol: "kitty" | "iterm2" | "sixel" | "none";
  mouse: boolean;
  clipboard: boolean;
  colors: number;
}

class CapabilityDetector {
  private profile: TerminalCapabilityProfile | null = null;

  async detect(): Promise<TerminalCapabilityProfile> {
    const env = process.env;
    const term = env.TERM ?? "";
    const colorterm = env.COLORTERM ?? "";

    const trueColor = colorterm === "truecolor" || colorterm === "24bit";
    const unicode = env.LC_ALL?.includes("UTF-8") ?? env.LC_CTYPE?.includes("UTF-8") ?? env.LANG?.includes("UTF-8") ?? true;
    const colors = trueColor ? 16_777_216 : term.endsWith("256color") ? 256 : 8;

    const imageProtocol = this.detectImageProtocol(env);
    const mouse = true; // most modern terminals support mouse
    const clipboard = true; // OSC 52 support

    this.profile = { trueColor, unicode, imageProtocol, mouse, clipboard, colors };
    return this.profile;
  }

  getProfile(): TerminalCapabilityProfile {
    if (!this.profile) throw new Error("Capabilities not yet detected");
    return this.profile;
  }

  private detectImageProtocol(env: Record<string, string | undefined>): "kitty" | "iterm2" | "sixel" | "none" {
    if (env.TERM_PROGRAM === "iTerm.app") return "iterm2";
    if (env.KITTY_WINDOW_ID) return "kitty";
    if (env.TERM === "sixel") return "sixel";
    return "none";
  }
}

export const capabilities = new CapabilityDetector();
