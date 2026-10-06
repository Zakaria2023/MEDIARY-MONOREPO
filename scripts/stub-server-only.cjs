/**
 * Makes `import "server-only"` a no-op, for scripts.
 *
 * `packages/storage` opens with that import, and it exists to do exactly what it
 * did here: throw the moment the module is pulled into anything that is not a
 * React Server Component. A plain Node script is not one, so importing the R2
 * helpers from a command line fails before the first line of the script runs.
 *
 * Preloaded with `-r`, so it is in `require.cache` before any ESM import is
 * resolved. It is `.cjs` because it has to run before the TypeScript
 * transformation, not after it.
 */
const path = require.resolve("server-only");

require.cache[path] = {
  id: path,
  filename: path,
  loaded: true,
  exports: {},
  children: [],
  paths: [],
};
