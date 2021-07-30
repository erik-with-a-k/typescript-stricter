module.exports = {
  roots: ["<rootDir>"],
  testMatch: ["**/test.ts", "**/*.test.ts"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
};
