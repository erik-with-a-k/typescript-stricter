import { readFileSync, writeFileSync } from "fs";
import { ErrorHandler, isSplice, isReplacement } from "./types";
import { splice } from "./cut";
import {
  parameterImplicitlyHasAnAnyType,
  bindingElementImplicitlyHasAnAnyType,
} from "./handlers";
import * as minimist from "minimist";

const { tsc: tscDumpFile, repo: pathToRepo } = minimist(process.argv.slice(2));

if (!tscDumpFile) {
  throw new Error(
    "You must provide a path to a tsc dump, E.g.: yarn fix --tsc=TYPECHECK000"
  );
}

if (!pathToRepo) {
  throw new Error(
    "You must provide a path to the repo tsc ran in, E.g.: yarn fix --repo=/path/to/repo"
  );
}

console.log({ tscDumpFile, pathToRepo });

const issues = readFileSync(tscDumpFile).toString().split("\n");

const BASE_PATH = pathToRepo.replace(/\/$/, "");

const ERROR_HANDLERS: ErrorHandler[] = [
  parameterImplicitlyHasAnAnyType,
  // bindingElementImplicitlyHasAnAnyType,
];

let isDirty = false;
let loadedFilename: string | undefined;
let fileContents: string[] | undefined;

function isLoaded(
  fileContents: string[] | undefined
): fileContents is string[] {
  return Boolean(fileContents);
}

let numInsertedByLineNumber: Record<number, number> = {};

issues.forEach((issue) => {
  const match = issue.match(
    /^([^(]+)\(([0-9]+),([0-9]+)\): error (TS[0-9]+): (.*)$/
  );

  if (!match) {
    // console.warn(`Issue doesn't seem to be an error: ${issue}`);
    return;
  }
  const [, filename, lineNumberString, columnString, errorCode, errorString] =
    match;
  const lineNumber = parseInt(lineNumberString);
  const column = parseInt(columnString);

  if (loadedFilename !== filename && fileContents) {
    if (isDirty) save(fileContents, BASE_PATH + "/" + loadedFilename);
  }

  if (loadedFilename !== filename) {
    fileContents = readFileSync(BASE_PATH + "/" + filename)
      .toString()
      .split("\n");
    loadedFilename = filename;
    isDirty = false;
    numInsertedByLineNumber = {};
  }

  ERROR_HANDLERS.forEach((handler) => {
    if (!isLoaded(fileContents)) return;
    const numInserted = numInsertedByLineNumber[lineNumber] || 0;
    const edit = handler({
      fileContents,
      filename,
      lineNumber,
      column,
      errorCode,
      errorString,
      numInserted,
    });
    if (!edit) return;
    const lineIndex = edit.lineNumber - 1;
    const line = fileContents[lineIndex];

    if (isSplice(edit)) {
      fileContents[lineIndex] = splice(line, edit);
      console.log(
        `${filename}: ${handler.name} spliced "${edit.text}" into line ${edit.lineNumber} at ${edit.splitPoint}\n  Before: ${line}\n  After: ${fileContents[lineIndex]}`
      );
    }
    if (isReplacement(edit)) {
      fileContents[lineIndex] = line.replace(edit.replace, edit.with);
      console.log(
        `${filename}: ${handler.name} replaced /${edit.replace}/ with "${edit.with}" on line ${edit.lineNumber}\n  Before: ${line}\n  After: ${fileContents[lineIndex]}`
      );
    }

    isDirty = true;

    const numNewlyInserted = fileContents[lineIndex].length - line.length;
    numInsertedByLineNumber[lineNumber] = numInserted + numNewlyInserted;
  });

  if (!isDirty) {
    const line = fileContents[lineNumber - 1];
    console.log(`Issue not handled: ${issue}\n  ${line}`);
  }
});

function save(fileContents: string[], path: string) {
  console.log(`Saving ${path}`);
  writeFileSync(path, fileContents.join("\n"));
}
