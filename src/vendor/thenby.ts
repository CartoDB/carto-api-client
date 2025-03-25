/**
   Copyright 2013 Teun Duynstee

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// Modifications by Don McCurdy, for minimal TypeScript compatibility. Moved
// into 'vendor' to avoid CJS/ESM compatibility issues in Web Workers.

export const firstBy: any = (function () {
  function identity(v: unknown) {
    return v;
  }

  function ignoreCase(v: unknown) {
    return typeof v === 'string' ? v.toLowerCase() : v;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function makeCompareFunction(f: Function | string, opt: any) {
    opt = typeof opt === 'object' ? opt : {direction: opt};

    if (typeof f != 'function') {
      const prop = f;
      // make unary function
      f = function (v1: Record<string, unknown>) {
        return v1[prop] ? v1[prop] : '';
      };
    }
    if (f.length === 1) {
      // f is a unary function mapping a single item to its sort score
      const uf = f;
      const preprocess = opt.ignoreCase ? ignoreCase : identity;
      const cmp =
        opt.cmp ||
        function (v1: number, v2: number) {
          return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
        };
      f = function (v1: unknown, v2: unknown) {
        return cmp(preprocess(uf(v1)), preprocess(uf(v2)));
      };
    }
    const descTokens = {'-1': '', desc: ''};
    if (opt.direction in descTokens)
      return function (v1: unknown, v2: unknown) {
        return -f(v1, v2);
      };
    return f;
  }

  /* adds a secondary compare function to the target function (`this` context)
       which is applied in case the first one returns 0 (equal)
       returns a new compare function, which has a `thenBy` method as well */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function tb(func: Function, opt: any) {
    /* should get value false for the first call. This can be done by calling the
        exported function, or the firstBy property on it (for es6 module compatibility)
        */
    // @ts-expect-error Allowing otherwise-unwanted pattern in third-party code.
    const x = typeof this == 'function' && !this.firstBy ? this : false;
    const y = makeCompareFunction(func, opt);
    const f = x
      ? function (a: unknown, b: unknown) {
          return x(a, b) || y(a, b);
        }
      : y;
    // @ts-expect-error Allowing otherwise-unwanted pattern in third-party code.
    f.thenBy = tb;
    return f;
  }
  tb.firstBy = tb;
  return tb;
})();
