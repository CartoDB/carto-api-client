# Contributing

_Contributions are subject to CARTO's [community contributions policy](https://carto.com/contributions/)._

## Local development requirements

- Yarn v4+
- Node.js v18+

## Quickstart

To configure Node.js and Yarn versions, install [nvm](https://github.com/nvm-sh/nvm) and run:

```bash
# set recommended Node.js version
nvm use

# enable Corepack, which will set recommended Yarn version
corepack enable
```

To install and build `@carto/api-client` locally from source:

```bash
# install dependencies
yarn

# build package once
yarn build

# build package and watch for changes
yarn build --watch

# build package, watch for changes, and start a local server for examples
yarn dev
```

After running `yarn dev`, a browser window will open with links each example. The local URL will generally be `localhost:5173`.

To run tests, coverage, or a linter:

```bash
# run tests once
yarn test

# run tests and watch for changes
yarn test:watch

# run tests and gather code coverage
yarn coverage

# lint for style and formatting errors
yarn lint

# fix style and formatting errors
yarn format
```

Tests, coverage, and other development-related scripts are defined in `package.json#scripts`.

## Official releases

1. Update changelog

2. Create a new version: `yarn version [ major | minor | patch ]`

3. Commit, tag, and push to GitHub: `yarn postversion`

4. Publish

   Open a pull request, get any required approvals, and merge. Merged pull requests with commit messages beginning `chore(release)` will trigger a release automatically.

## Work-in-progress alpha releases

To publish a prerelease from any branch, [manually run](https://github.com/CartoDB/carto-api-client/actions/workflows/release.yml) the “Release” workflow, selecting the target branch in the menu.

It will bump the patch version and add prerelease tags to make it unique:

Example: `0.5.26` → `0.5.27-alpha.482101a.112`

The package is published to npm under the `alpha` dist tag. A `dry_run` option is available to test the workflow without publishing.
