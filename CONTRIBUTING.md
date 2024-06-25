# Contributing

## Local development requirements

- Yarn v4+
- Node.js v18+

## Quickstart

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

After running `yarn dev`, a browser window will open with links to examples. Local URL will be `localhost:5173`, or may use another available port number.

Tests, coverage, and other developmen-related scripts are defined in `package.json#scripts`.

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
