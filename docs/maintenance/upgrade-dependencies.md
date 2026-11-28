---
title: Upgrading Dependencies
read_when:
  - upgrading or updating dependencies
---

# Upgrading Dependencies

Refuse to start when the working tree is dirty: `git status` must report nothing to commit.

## Procedure

```sh
# Update `package.json`. `--dep` leaves out `packageManager` and peer dependencies.
npx --yes npm-check-updates -u --dep "prod,dev,optional"

npm install
npm run build
npm run lint
npm test
```

`npm run build` is the typecheck of `src/`. Vitest runs the tests without checking their types.

Rules:

- Upgrade every dependency, major versions included. Set each [pinned package](#pinned-packages) back to the latest version of its allowed range before the install.
- Search the code for dependency versions written outside `package.json`, such as in the README or tests, and update them. `npm-check-updates` does not see them.
- `npm-check-updates` skips `peerDependencies`. Align their ranges by hand: each range accepts the versions the tests use, and excludes the versions known to break the dialect.
- Leave the Node and npm versions unchanged: `.nvmrc`, `engines`, `packageManager`.
- Fix what breaks, in code, configuration or types. Read the migration guide of each new major version.
- When a dependency causes too much trouble, revert it to its previous version and pin it below, with the reason.
- When the reason of a pin no longer holds, remove the pin.
- npm warns about install scripts not yet approved (`npm install-scripts approve`). Leave the warning, and approve none.

## Biome

- When a new Biome version checks more files, as 2.6 did with Markdown, keep the checks on. Exclude only the files that tools write, with negated globs in `files.includes`.
- Keep `"markdown": { "parser": { "frontmatter": true } }` in `biome.json`. Without it, `npm run lint:fix` breaks the YAML front matter of the docs.
- Run `npm run lint:fix` and review the result. Biome reformats the tables and code samples of Markdown files.
- `nursery.noFloatingPromises` stays on. With Biome 2.6.9, it raises `biome check .` from 0.3 s and 50 MB to 0.8 s and 110 MB. Measure both runs again with `/usr/bin/time -v` at each Biome upgrade, and turn the rule off when its cost becomes too high.

## Pinned packages

- `@types/node`: `26.x`. It follows the Node version of `.nvmrc`.
- `@libsql/client`: `0.17.x` in `devDependencies`, and `>=0.17.0 <0.18.0` in `peerDependencies`. Version `0.18.0` runs each `execute()` on a connection borrowed from a pool, and rolls back any open transaction when the connection returns to the pool. The `BEGIN`/`COMMIT` statements that the dialect sends for local files no longer share a transaction, and the transaction tests fail. Native transactions (`client.transaction()`) work for local files on 0.18 but lose in-memory databases on 0.17, so supporting 0.18 means dropping 0.17.

## Resetting `node_modules` and the lock file

As a last resort, when the install stays broken, delete `node_modules` and the lock file, then install again:

```sh
rm -rf node_modules package-lock.json
npm install
```
