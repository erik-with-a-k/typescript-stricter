import {
  bindingElementImplicitlyHasAnAnyType,
  parameterImplicitlyHasAnAnyType,
} from "./handlers";
import { splice } from "./cut";
import { Splice, isSplice, Edit } from "./types";

describe("two untyped arguments in a function definition", () => {
  const filename = "@clubhouse/feature-toggles/index.ts";
  const lineNumber = 85;
  const line =
    "export const generateLDUserFromCHUser = (user, currentOrgData) => {";
  const fileContents: string[] = [];
  fileContents[lineNumber - 1] = line;
  const LENGTH_OF_INSERT = ": any".length;

  const baseErrorDetails = {
    filename,
    lineNumber,
    fileContents,
    errorCode: "TS7006",
  } as const;

  describe("fixing the first argument", () => {
    let userEdit: Edit;
    let lineWithFirstSplice: string;
    beforeAll(() => {
      debugger;
      userEdit = parameterImplicitlyHasAnAnyType({
        ...baseErrorDetails,
        errorString: `Parameter 'user' implicitly has an 'any' type.`,
        column: 42,
        numInserted: 0,
      });
      if (isSplice(userEdit)) {
        lineWithFirstSplice = splice(line, userEdit);
      }
    });

    it("should return a splice", () => {
      expect(isSplice(userEdit)).toBeTruthy();
    });

    it("should splice an `: any` after `user`", () => {
      if (!isSplice(userEdit)) return;
      expect(lineWithFirstSplice).toEqual(
        "export const generateLDUserFromCHUser = (user: any, currentOrgData) => {"
      );
      expect(lineWithFirstSplice.length - line.length).toEqual(
        LENGTH_OF_INSERT
      );
    });

    describe("and then the fixing the second argument", () => {
      let currentOrgDataEdit: Edit;
      beforeAll(() => {
        currentOrgDataEdit = parameterImplicitlyHasAnAnyType({
          ...baseErrorDetails,
          errorString: `Parameter 'currentOrgData' implicitly has an 'any' type.`,
          column: 48,
          numInserted: LENGTH_OF_INSERT,
        });
      });

      it("should return a splice", () => {
        expect(isSplice(currentOrgDataEdit)).toBeTruthy();
      });

      it("should splice an `: any` after `user`", () => {
        if (!isSplice(currentOrgDataEdit)) return;
        const lineWithSecondSplice = splice(
          lineWithFirstSplice,
          currentOrgDataEdit
        );
        expect(lineWithSecondSplice).toEqual(
          "export const generateLDUserFromCHUser = (user: any, currentOrgData: any) => {"
        );
        expect(
          lineWithSecondSplice.length - lineWithFirstSplice.length
        ).toEqual(LENGTH_OF_INSERT);
      });
    });
  });
});

describe("properties destructured in a function definition", () => {
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

describe("adding any to optional arguments", () => {
  const filename =
    "@clubhouse/web/components/settings/manage-billing/UpgradeToStandardDialog.tsx";
  const line = "  onConfirm?: (args?: object, coupon_code?) => void;";
  const lineNumber = 183;
  const fileContents: string[] = [];
  fileContents[lineNumber - 1] = line;
  let edit: Edit;

  beforeAll(() => {
    debugger;
    edit = parameterImplicitlyHasAnAnyType({
      filename,
      fileContents,
      lineNumber,
      errorCode: "TS7006",
      errorString: `Parameter 'coupon_code' implicitly has an 'any' type.`,
      column: 31,
      numInserted: 0,
    });
  });

  it("should return a splice", () => {
    expect(isSplice(edit)).toBeTruthy();
  });

  it("should splice the : any AFTER the question mark", () => {
    expect(splice(line, edit as Splice)).toBe(
      "  onConfirm?: (args?: object, coupon_code?: any) => void;"
    );
  });
});
