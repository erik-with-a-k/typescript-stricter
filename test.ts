import { bindingElementImplicitlyHasAnAnyType } from "./handlers";
import { splice } from "./cut";
import { Splice, isSplice } from "./types";

describe("properties destructured from a function argument definition", () => {
  const fileContents: string[] = [];
  const lineNumber = 95;
  const line = "const getPermission = ({ user, slimWorkspace }) => {";
  fileContents[lineNumber - 1] = line;

  const baseErrorDetails = {
    fileContents,
    filename: "@clubhouse/fetch-and-cache/index.ts",
    lineNumber,
    errorCode: "TS7031",
    numInserted: 0,
  } as const;

  it("should skip all but the last property", () => {
    const edit = bindingElementImplicitlyHasAnAnyType({
      ...baseErrorDetails,
      column: 26,
      errorString: `Binding element 'user' implicitly has an 'any' type.`,
    });
    expect(edit).toBeUndefined();
  });

  it("should return a splice after the last property", () => {
    debugger;
    const edit = bindingElementImplicitlyHasAnAnyType({
      ...baseErrorDetails,
      column: 32,
      errorString: `Binding element 'slimWorkspace' implicitly has an 'any' type.`,
    });
    expect(isSplice(edit)).toBeTruthy;
    if (!isSplice(edit)) return;
    expect(splice(line, edit)).toBe(
      "const getPermission = ({ user, slimWorkspace }: any) => {"
    );
  });

  it("should insert the any type after the destructuring", () => {
    const edit = bindingElementImplicitlyHasAnAnyType({
      ...baseErrorDetails,
      column: 32,
      errorString: `Binding element 'slimWorkspace' implicitly has an 'any' type.`,
    });
    expect(splice(line, edit as Splice)).toBe(
      "const getPermission = ({ user, slimWorkspace }: any) => {"
    );
  });
});
