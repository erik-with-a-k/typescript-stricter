Currently `typescript-stricter` adds `: any`s so that you can turn on `noImplicitAny: true` in your `tsconfig.json`.

### How to run

```
git clone git@github.com:erik-with-a-k/typescript-stricter.git
cd /path/to/your/typescript/project
tsc >> /path/to/typescript-stricter/TYPECHECK001
cd /path/to/typescript-stricter
yarn
yarn fix --tsc=TYPCHECK001 --repo=/path/to/your/typescript/prokect
```

### Debugging

If something isn't working properly, you may want to throw some `debugger` calls in `fix.ts` or in `handler.ts` and then run with the debugger:

```
yarn fix:debug --tsc=TYPCHECK001 --repo=/path/to/your/typescript/prokect
// Then open chrome:inspect and hit play
```

### Running tests

```
yarn test
```
In watch mode:
```
yarn test:watch
```
Attach to debugger:
```
yarn test:debug
// Then open chrome:inspect and hit play
```
Run a specific test:
```
yarn test -t="adding any to optional arguments"
yarn test:debug -t="adding any to optional arguments"
```