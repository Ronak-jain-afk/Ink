import { getActions, isPaletteOpen, getSelectedIndex } from "../modules/palette/store";

export function PaletteOverlay({ rev }: { rev: number }) {
  if (!isPaletteOpen()) return null;

  const actions = getActions();
  const selected = getSelectedIndex();

  return (
    <box flexDirection="column" paddingLeft={1} paddingRight={1}>
      {actions.map((a, i) => (
        <text key={a.id} content={` ${i === selected ? ">" : " "} ${a.category}: ${a.label}${a.keybinding ? ` [${a.keybinding}]` : ""}`} />
      ))}
    </box>
  );
}
