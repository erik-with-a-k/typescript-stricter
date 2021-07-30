import fs from "fs";

const issues = fs.readFileSync("./TYPECHECK2").toString().split("\n");

interface Change {
    lineNumber: number
    column: number
    parameter: string
}

const changesByFile: Record<string,Change[]> = {};

function addAnysToFunctionArguments(line: string) {
  const match = line.match(
    /^([^(]+)\(([0-9]+),([0-9]+)\): error TS7006: Parameter '(.+)' implicitly has an 'any' type.$/
  );
  if (!match) return;
  const [, filename, lineNumber, column, parameter] = match;
  const changes = changesByFile[filename] || [];
  changes.push({
    lineNumber: parseInt(lineNumber),
    column: parseInt(column),
    parameter,
  });
  changesByFile[filename] = changes;
  return true;
}

function addAnysToDestructured(line: string) {
  const match = line.match(
    /^([^(]+)\(([0-9]+),([0-9]+)\): error TS7031: Binding element '(.+)' implicitly has an 'any' type.$/
  );
  if (!match) return;
  let [, filename, lineNumberString, columnString, parameter] = match;
  const column = parseInt(columnString);
  const lineNumber = parseInt(lineNumberString);
  const changes = changesByFile[filename] || [];
  const change = { lineNumber, column: column + 2, parameter };
  const existing = changes.find((chg) => chg.lineNumber === lineNumber);
  if (!existing) {
    changes.push(change);
  } else {
    Object.assign(existing, change);
  }
  changesByFile[filename] = changes;
  return true;
}

issues.forEach((line) => {
  //   addAnysToFunctionArguments(line);
  // addAnysToDestructured(line);
});

for (const filename of Object.keys(changesByFile)) {
  const lines = fs.readFileSync(filename).toString().split("\n");
  const changes = changesByFile[filename];
  let inserted = 0;
  let insertedAtLine;

  for (const { lineNumber, column, parameter } of changes) {
    if (lineNumber !== insertedAtLine) inserted = 0;
    const line = lines[lineNumber - 1];

    if (line.match(/\s*[^,]+,$/)) {
      /**
       * This is stuff like:
       *
       *     20  export const SelectMenu = ({
       *     21    getItemProps,
       *     22    highlightedIndex,
       *     23    selectedValues,
       *     24  }) => {
       *
       * where we'll get errors on 21, 22, and 23. So we need to drop down to the next
       * line and replace the }) with }: any)
       *
       *
       **/

      const nextLine = lines[lineNumber];
      lines[lineNumber] = nextLine.replace(
        /^([0-9a-zA-Z_]*)( = )?[0-9a-zA-Z_]\}\)/,
        "$1: any)"
      );
    } else if (line.charAt(column + 1) === "]") {
      /**
       * This is when we're destructuring an array argument not an object, E.g.:
       *
       *     profiles.filter(([, type]) => type === 'update')
       *
       * where we just want to go past the ] to add the :any
       */
      const splitPoint = column + 2;
      lines[lineNumber - 1] =
        line.slice(0, splitPoint) + ": any" + line.slice(splitPoint);
    } else {
      const splitPoint = column + inserted + parameter.length - 1;
      lines[lineNumber - 1] =
        line.slice(0, splitPoint) + ": any" + line.slice(splitPoint);
      inserted += 5;
      insertedAtLine = lineNumber;
    }
  }
  console.log(`Saving ${filename}`);
  fs.writeFileSync(filename, lines.join("\n"));
}
