Currently `typescript-stricter` adds `: any`s so that you can turn on `noImplicitAny: true` in your `tsconfig.json`.

### How to run

```
git clone git@github.com:erik-with-a-k/typescript-stricter.git
cd /path/to/your/typescript/project
tsc >> /path/to/typescript-stricter/TYPECHECK001
cd /path/to/typescript-stricter
yarn
yarn ts-node fix.ts
```