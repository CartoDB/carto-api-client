import {describe, it, expect} from 'vitest';
import {
  _createVecExprEvaluator as createVecExprEvaluator,
  _ErrorCode as ErrorCode,
  _validateVecExprSyntax as validateVecExprSyntax,
  _VecExprResult as VecExprResult,
} from '@carto/api-client';

const repeat = (n, fn) => {
  for (let i = 0; i < n; i++) {
    fn();
  }
};

describe('vecExprEvaluator', () => {
  const band_1 = [1, 2, 3, 4, 5];
  const band_2 = [10, 10, 10, 10, 10];
  const band_3 = [0, 1, 0, 1, 0];

  const safeCreateVecExprEvaluator = (expr: string) => {
    const evaluator = createVecExprEvaluator(expr);
    if (!evaluator) {
      throw new Error(`Failed to create evaluator for ${expr}`);
    }
    return evaluator;
  };

  describe('evaluate', () => {
    it('works with numbers', () => {
      expect(safeCreateVecExprEvaluator('1')({})).toEqual(1);
      expect(safeCreateVecExprEvaluator('-23.3')({})).toEqual(-23.3);
      expect(safeCreateVecExprEvaluator('0')({})).toEqual(0);
    });
    it('works vector + number expressions', () => {
      expect(safeCreateVecExprEvaluator('band_1 + 1')({band_1})).toEqual([
        2, 3, 4, 5, 6,
      ]);
      expect(safeCreateVecExprEvaluator('1 + band_1')({band_1})).toEqual([
        2, 3, 4, 5, 6,
      ]);
    });
    it('works vector + vector expressions', () => {
      expect(safeCreateVecExprEvaluator('band_1 + band_1')({band_1})).toEqual([
        2, 4, 6, 8, 10,
      ]);
      expect(safeCreateVecExprEvaluator('band_1 * band_1')({band_1})).toEqual([
        1, 4, 9, 16, 25,
      ]);
      expect(
        safeCreateVecExprEvaluator('(band_1 - 1 ) * band_1')({band_1})
      ).toEqual([0, 2, 6, 12, 20]);
      expect(
        safeCreateVecExprEvaluator('band_1  / band_2')({band_1, band_2})
      ).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    });
    it('works vector vs vector logical expressions', () => {
      expect(
        safeCreateVecExprEvaluator('band_3 || band_1')({band_1, band_3})
      ).toEqual([1, 1, 3, 1, 5]);
      expect(
        safeCreateVecExprEvaluator('band_3 && band_2')({band_2, band_3})
      ).toEqual([0, 10, 0, 10, 0]);
    });

    it(`uint8 arithmetic doesn't overflow`, () => {
      // we have to ensure, we don't do math on bytes, so we don't overflow easily
      // (83+98+93) would actually overflow and result would be bad
      const band_1 = new Uint8Array([60, 83, 90, 86, 80, 77]);
      const band_2 = new Uint8Array([75, 98, 105, 101, 93, 90]);
      const band_3 = new Uint8Array([70, 93, 100, 96, 86, 83]);
      expect(
        safeCreateVecExprEvaluator('(band_1 + band_2 + band_3)/3')({
          band_1,
          band_2,
          band_3,
        })
      ).toEqual(
        Array.from(band_1).map((v, i) => {
          return (band_1[i] + band_2[i] + band_3[i]) / 3;
        })
      );
    });
  });
  describe('validate', () => {
    const validResult = {valid: true};
    it('supports basic valid literals', () => {
      expect(validateVecExprSyntax('1', {})).toEqual(validResult);
      expect(validateVecExprSyntax('-1', {})).toEqual(validResult);
      expect(validateVecExprSyntax('0', {})).toEqual(validResult);
      expect(validateVecExprSyntax('1.2', {})).toEqual(validResult);
      expect(validateVecExprSyntax('-1.2', {})).toEqual(validResult);
      expect(validateVecExprSyntax('1e4', {})).toEqual(validResult);
      expect(validateVecExprSyntax('-1.5e4', {})).toEqual(validResult);
    });
    it('accepts known symbols', () => {
      expect(validateVecExprSyntax('a', {a: '1'})).toEqual(validResult);
      expect(validateVecExprSyntax('1 ? b : a', {a: 1, b: 2})).toEqual(
        validResult
      );
      expect(validateVecExprSyntax('1==2 ? b : a', {a: 1, b: 2})).toEqual(
        validResult
      );
    });
    it('accepts basic arithmetics on symbols', () => {
      const context = {band_1: true, band_2: true};

      expect(validateVecExprSyntax('band_1 ? band_2 : 1', context)).toEqual(
        validResult
      );
      expect(validateVecExprSyntax('(band_1 + band_2) / 2', context)).toEqual(
        validResult
      );
      expect(validateVecExprSyntax('band_1 + 4', context)).toEqual(validResult);
    });
    it('rejects unsupported literals', () => {
      const invalidLiteral = {
        valid: false,
        errorCode: ErrorCode.InvalidSyntax,
        errorMessage: 'Only number literals are supported',
      };
      expect(validateVecExprSyntax('false', {})).toEqual(invalidLiteral);
      expect(validateVecExprSyntax('true', {})).toEqual(invalidLiteral);
      expect(validateVecExprSyntax('1 || "abc"', {a: '1'})).toEqual(
        invalidLiteral
      );
      expect(validateVecExprSyntax("'abc'", {})).toEqual(invalidLiteral);
    });
    it('rejects unsupported globals', () => {
      expect(validateVecExprSyntax('NaN', {})).toEqual({
        valid: false,
        errorCode: ErrorCode.UnknownIdentifier,
        errorMessage: '"NaN" not found',
      });
      expect(validateVecExprSyntax('Math', {})).toMatchObject({valid: false});
      expect(validateVecExprSyntax('fetch', {})).toMatchObject({valid: false});
      expect(validateVecExprSyntax('Object', {})).toMatchObject({valid: false});
      expect(validateVecExprSyntax('window', {})).toMatchObject({valid: false});
      expect(validateVecExprSyntax('hasOwnProperty', {})).toMatchObject({
        valid: false,
      });
    });
    it('rejects function calls & member access', () => {
      expect(validateVecExprSyntax('a(1)', {a: 1})).toEqual({
        errorCode: ErrorCode.InvalidSyntax,
        valid: false,
        errorMessage: 'Not allowed',
      });
      expect(validateVecExprSyntax('a.length', {a: [1, 2, 3]})).toMatchObject({
        valid: false,
        errorCode: ErrorCode.InvalidSyntax,
        errorMessage: 'Not allowed',
      });
    });
    it('rejects unknown symbols', () => {
      expect(validateVecExprSyntax('c', {a: '1'})).toEqual({
        valid: false,
        errorCode: ErrorCode.UnknownIdentifier,
        errorMessage: '"c" not found',
      });
      expect(validateVecExprSyntax('a', {})).toEqual({
        valid: false,
        errorCode: ErrorCode.UnknownIdentifier,
        errorMessage: '"a" not found',
      });
      expect(validateVecExprSyntax('a ? b : 1', {a: '1'})).toEqual({
        valid: false,
        errorCode: ErrorCode.UnknownIdentifier,
        errorMessage: '"b" not found',
      });
    });
    it('rejects totally broken syntax', () => {
      const context = {band_1: true, band_2: true};
      expect(validateVecExprSyntax('1 + ', context)).toEqual({
        valid: false,
        errorCode: ErrorCode.InvalidSyntax,
        errorMessage: 'Expected expression after + at character 4',
      });
      expect(validateVecExprSyntax('band_1 + 2)', context)).toEqual({
        valid: false,
        errorCode: ErrorCode.InvalidSyntax,
        errorMessage: 'Unexpected ")" at character 10',
      });
      expect(validateVecExprSyntax('(2 + band_1', context)).toEqual({
        valid: false,
        errorCode: ErrorCode.InvalidSyntax,
        errorMessage: 'Unclosed ( at character 11',
      });
      expect(validateVecExprSyntax('(2band_1+', context)).toEqual({
        valid: false,
        errorCode: ErrorCode.InvalidSyntax,
        errorMessage:
          'Variable names cannot start with a number (2b) at character 2',
      });
    });
  });

  // const PERFTEST_REPETITIONS = 4; // repeats, by default decreased not to slow down the tests
  const PERFTEST_REPETITIONS = 15; // repeats, with 15-20 (at least on M1) you should see actual numbers reported by vitest
  const PERFTEST_ARRAYS_SIZE = 200000; // size of arrays

  // this test shows that it was necessary to vectorize the expression evaluation
  describe(`performance ${PERFTEST_REPETITIONS} x evaluate expr on array ${PERFTEST_ARRAYS_SIZE}`, () => {
    const band_1 = Array.from(new Array(PERFTEST_ARRAYS_SIZE)).map(
      (_, i) => i % 255
    );
    const band_2 = Array.from(new Array(PERFTEST_ARRAYS_SIZE)).map(
      (_, i) => 255 - (i % 255)
    );
    const band_3 = Array.from(new Array(PERFTEST_ARRAYS_SIZE)).map(
      (_, i) => (i % 255) / 2
    );

    const expression = '(band_1 - band_2 + band_3)/3';
    const expectedResult = Array.from(band_1).map((v, i) => {
      return (band_1[i] - band_2[i] + band_3[i]) / 3;
    });

    // asserts are very slow actually - like 1s on big arrays so disable them by default
    const validateResult = false; // true

    it(`vectorized`, () => {
      let result: VecExprResult = [];
      repeat(PERFTEST_REPETITIONS, () => {
        result = safeCreateVecExprEvaluator(expression)({
          band_1,
          band_2,
          band_3,
        });
      });

      if (validateResult) {
        expect(result).toEqual(expectedResult);
      }
    });
    it(`non-vectorized / plain object`, () => {
      const evaluator = safeCreateVecExprEvaluator(expression);
      let result: number[] = [];
      repeat(PERFTEST_REPETITIONS, () => {
        result = new Array(PERFTEST_ARRAYS_SIZE);
        for (let i = 0; i < PERFTEST_ARRAYS_SIZE; i++) {
          const obj = {band_1: band_1[i], band_2: band_2[i], band_3: band_3[i]};
          result[i] = evaluator(obj) as number;
        }
      });
      if (validateResult) {
        expect(result).toEqual(expectedResult);
      }
    });
    it(`non-vectorized / reuse plain object`, () => {
      const evaluator = safeCreateVecExprEvaluator(expression);
      const obj = {band_1: 0, band_2: 0, band_3: 0};

      let result: number[] = [];
      repeat(PERFTEST_REPETITIONS, () => {
        result = new Array(PERFTEST_ARRAYS_SIZE);
        for (let i = 0; i < PERFTEST_ARRAYS_SIZE; i++) {
          obj.band_1 = band_1[i];
          obj.band_2 = band_2[i];
          obj.band_3 = band_3[i];
          result[i] = evaluator(obj) as number;
        }
      });
      if (validateResult) {
        expect(result).toEqual(expectedResult);
      }
    });
    it(`non-vectorized / proxy object`, () => {
      const evaluator = safeCreateVecExprEvaluator(expression);
      const bands = {band_1, band_2, band_3};

      let result: number[] = [];
      repeat(PERFTEST_REPETITIONS, () => {
        result = new Array(PERFTEST_ARRAYS_SIZE);
        for (let i = 0; i < PERFTEST_ARRAYS_SIZE; i++) {
          const obj = new Proxy(
            {},
            {
              get(target, property) {
                return bands[property as string][i];
              },
            }
          );
          result[i] = evaluator(obj) as number;
        }
      });
      if (validateResult) {
        expect(result).toEqual(expectedResult);
      }
    });
    it(`perf: non-vectorized / reused proxy object`, () => {
      // on M1/node20 this test shows that proxy objects are slower than plain objects
      const evaluator = safeCreateVecExprEvaluator(expression);
      const bands = {band_1, band_2, band_3};

      let result: number[] = [];
      let i = 0;
      const obj = new Proxy(
        {},
        {
          get(target, property) {
            return bands[property as string][i];
          },
        }
      );
      repeat(PERFTEST_REPETITIONS, () => {
        result = new Array(PERFTEST_ARRAYS_SIZE);
        for (i = 0; i < PERFTEST_ARRAYS_SIZE; i++) {
          result[i] = evaluator(obj) as number;
        }
      });
      if (validateResult) {
        expect(result).toEqual(expectedResult);
      }
    });
  });
});
