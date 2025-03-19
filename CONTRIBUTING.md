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

## Releases

1. Update changelog

2. Create a new version: `yarn version [ major | minor | patch | prerelease ]`

3. Commit, tag, and push to GitHub: `yarn postversion`

4. Publish
   - If working on `main`, the previous step will automatically create and push a branch. Open a pull request, get any required approvals, and merge. Merged pull requests with commit messages beginning `chore(release)` will trigger a release automatically.
   - If working on a branch, a commit for the release will be pushed to the branch. You'll then need to [manually run a workflow](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow), “Release”, selecting the target branch in the menu.
