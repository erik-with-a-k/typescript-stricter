import { ErrorDetails, Edit } from "./types";

/**
 * This handler targets lines like
 *
 *     export const trackEvent = (eventName: any, customData = {}) => {
 *
 * and turns them into:
 *
 *     export const trackEvent = (eventName: any, customData: any = {}) => {
 **/
export function parameterImplicitlyHasAnAnyType({
  fileContents,
  lineNumber,
  column,
  numInserted,
  errorCode,
  errorString,
}: ErrorDetails): Edit {
  if (errorCode !== "TS7006") return;
  const match = errorString.match(
    /^Parameter '(.+)' implicitly has an '(any[^']*)' type.$/
  );
  if (!match)
    throw new Error(
      `${errorString} doesn't match the format we expected for TS7006 errors`
    );
  const [, parameter, type] = match;
  const line = fileContents[lineNumber - 1];
  if (type === "any") {
    const splitPoint = column + numInserted + parameter.length - 1;
    return {
      lineNumber,
      splitPoint,
      text: ":any",
    };
  }
}

const DESTRUCTURE_END_PATTERN = /^(\s*\})\) =>/;

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
export function bindingElementImplicitlyHasAnAnyType({
  fileContents,
  lineNumber,
  column,
  errorString,
  errorCode,
}: ErrorDetails): Edit {
  if (errorCode !== "TS7031") return;
  const line = fileContents[lineNumber - 1];

  const match = errorString.match(
    /^Binding element '(.+)' implicitly has an 'any' type.$/
  );
  if (!match) return;

  if (line.charAt(column + 1) === "]") {
    // This is when we're destructuring an array argument not an object
    // E.g.:
    //   profiles.filter(([, type]) => type === 'update')
    const splitPoint = column + 2;
    return {
      splitPoint,
      lineNumber,
      text: ": any",
    };
  }

  const [, parameter] = match;
  const isDestructuredPropertyLine = line.match(/\s*[^,]+,$/);
  const nextLine = fileContents[lineNumber];
  const nextLineIsDestructureEnd =
    nextLine && DESTRUCTURE_END_PATTERN.test(nextLine);
  const isLastOnSingleLine = line.charAt(column - 1 + parameter.length) === " ";

  if (isDestructuredPropertyLine && nextLineIsDestructureEnd) {
    return {
      replace: DESTRUCTURE_END_PATTERN,
      with: "$1: any) =>",
      lineNumber,
    };
  } else if (isLastOnSingleLine) {
    return {
      splitPoint: column + parameter.length + 1,
      lineNumber,
      text: ": any",
    };
  } else {
    console.log(
      `Skipping ${errorString} for line ${line} because it looks like there are more on that line`
    );
  }
}
