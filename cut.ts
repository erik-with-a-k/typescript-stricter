import { Splice } from "./types";

export function splice(line: string, edit: Splice) {
  return (
    line.slice(0, edit.splitPoint) + edit.text + line.slice(edit.splitPoint)
  );
}
