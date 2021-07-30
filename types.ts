export interface Change {
  lineNumber: number;
  column: number;
  parameter: string;
}

export interface ErrorDetails {
  filename: string;
  errorCode: string;
  errorString: string;
  lineNumber: number;
  column: number;
  numInserted: number;
  fileContents: string[];
}

export interface Splice {
  lineNumber: number;
  splitPoint: number;
  text: string;
}

export interface Replacement {
  replace: string | RegExp;
  with: string;
  lineNumber: number;
}

export type Edit = Splice | Replacement | undefined;

export type ErrorHandler = (details: ErrorDetails) => Edit;

export function isReplacement(edit: Edit): edit is Replacement {
  return edit ? "replace" in edit : false;
}

export function isSplice(edit: Edit): edit is Splice {
  return edit ? "splitPoint" in edit : false;
}
