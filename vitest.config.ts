import { configDefaults, defineConfig } from "vitest/config";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// `import "server-only"` throws unless the "react-server" condition resolves it
// to its empty file, which is what Next.js does on the server. A test is server
// code too, so it gets that same empty file: the test-runner counterpart of
// scripts/stub-server-only.cjs.
const serverOnlyEmpty = join(
  dirname(createRequire(import.meta.url).resolve("server-only")),
  "empty.js",
);

export default defineConfig({
  resolve: {
    alias: {
      "server-only": serverOnlyEmpty,
      // The apps' alias for the repo-root schema folder (tsconfig paths),
      // so a helper in an app that reads a label map can be tested here.
      "@/db": join(import.meta.dirname, "db"),
    },
  },
  test: {
    // Apps as well as packages: a rule that is genuinely about ONE app (which
    // routes it serves, say) belongs in that app, beside the code it checks.
    include: ["packages/**/src/**/*.test.ts", "apps/**/src/**/*.test.ts"],
    // `*.integration.test.ts` ends in `.test.ts`, so the glob above happily
    // claims it. Those need a database and belong to
    // vitest.integration.config.ts; run here they fail on the credentials
    // check. Spread the defaults rather than replacing them: setting `exclude`
    // at all drops node_modules and dist unless you put them back.
    exclude: [...configDefaults.exclude, "**/*.integration.test.ts"],
    environment: "node",
  },
});
