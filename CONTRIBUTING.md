# Contributing

_Contributions are subject to CARTO's [community contributions policy](https://carto.com/contributions/)._

## Local development requirements

- Yarn v4+
- Node.js v18+

## Quickstart

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

1. Create a new version

```bash
yarn version [ major | minor | patch | prerelease ]
```

2. Update changelog and commit

```bash
git add -u
TAG=vX.Y.Z && git commit -m $TAG && git tag -a $TAG -m $TAG
```

3. Push to GitHub

```bash
git push && git push --tags
```

4. GitHub CI will publish to npm automatically
