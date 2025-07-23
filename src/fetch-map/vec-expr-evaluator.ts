import jsep from 'jsep';

/**
 * Create vector expresion evaluator.
 *
 * Used to calculate vector expressions, such as `(band_1 * 3) + band_2/2`,
 * where `band_1` and `band_2` are arrays or typed arrays.
 *
 * Note that all vector operations are element-wise, in paricular `band_1 * band_2`
 * is not "mathematical" dot or cross product, but just element-wise multiplication.
 *
 * Based on:
 * - Copyright (c) 2013 Stephen Oney, http://jsep.from.so/, MIT License
 * - Copyright (c) 2023 Don McCurdy, https://github.com/donmccurdy/expression-eval, MIT License
 */
export function createVecExprEvaluator(
  expression: string | jsep.Expression
): VecExprEvaluator | null {
  try {
    const parsed = compile(expression);
    const evalFun = (context: object) => evaluate(parsed, context);
    evalFun.symbols = getSymbols(parsed);
    return evalFun as VecExprEvaluator;
  } catch {
    return null;
  }
}

export function evaluateVecExpr(
  expression: string | jsep.Expression,
  context: object
) {
  try {
    return createVecExprEvaluator(expression)?.(context);
  } catch {
    return null;
  }
}

export enum ErrorCode {
  InvalidSyntax,
  UnknownIdentifier,
}

export type ValidationResult = {
  valid: boolean;
  errorCode?: ErrorCode;
  errorMessage?: string;
};

export function validateVecExprSyntax(
  expression: string | jsep.Expression,
  context: Record<string, unknown>
): ValidationResult {
  let parsed: jsep.Expression;
  try {
    parsed = compile(expression);
  } catch (e: any) {
    return {
      valid: false,
      errorCode: ErrorCode.InvalidSyntax,
      errorMessage: e && 'message' in e ? String(e.message) : String(e),
    };
  }
  return validate(parsed, context);
}

export function createValidationContext(
  validSymbols: string[]
): Record<string, unknown> {
  return validSymbols.reduce((acc, symbol) => {
    acc[symbol] = 1;
    return acc;
  }, {});
}

export type VecExprVecLike =
  | number[]
  | Float32Array
  | Float64Array
  | Uint8Array
  | Int8Array
  | Int32Array
  | Uint32Array
  | Uint16Array
  | Int16Array;

export type VecExprResult = number | VecExprVecLike;

export type VecExprEvaluator = {
  (context: object): VecExprResult;

  symbols?: string[];
};

function createResultArray(
  typeTemplate: VecExprVecLike,
  length: number = typeTemplate.length
): VecExprVecLike {
  return new Array(length);
}

function isVecLike(a: unknown): a is number[] {
  return Array.isArray(a) || ArrayBuffer.isView(a);
}

const createBinopVec =
  (scalarBinOp: (a: number, b: number) => number) =>
  (left: number[], right: number[]) => {
    const length = Math.min(left.length, right.length);
    const r = createResultArray(left, length);
    for (let i = 0; i < length; i++) {
      r[i] = scalarBinOp(left[i], right[i]);
    }
    return r;
  };

const createBinopVecNum =
  (scalarBinOp: (a: number, b: number) => number) =>
  (left: number[], right: number) => {
    const length = left.length;
    const r = createResultArray(left, length);
    for (let i = 0; i < length; i++) {
      r[i] = scalarBinOp(left[i], right);
    }
    return r;
  };

// number vec op
const createBinopNumVec =
  (scalarBinOp: (a: number, b: number) => number) =>
  (left: number, right: number[]) => {
    const length = right.length;
    const r = createResultArray(right, length);
    for (let i = 0; i < length; i++) {
      r[i] = scalarBinOp(left, right[i]);
    }
    return r;
  };

const createUnopVec = (scalarUnop: (a: number) => number) => (a: number[]) => {
  const length = a.length;
  const r = createResultArray(a, length);
  for (let i = 0; i < length; i++) {
    r[i] = scalarUnop(a[i]);
  }
  return r;
};

function mapDictValues<V, NewV>(dict: Record<string, V>, fun: (v: V) => NewV) {
  return Object.keys(dict).reduce(
    (acc, key) => {
      acc[key] = fun(dict[key]);
      return acc;
    },
    {} as Record<string, NewV>
  );
}

const binopsNum: Record<string, (a: number, b: number) => number> = {
  '||': (a: number, b: number) => a || b,
  '&&': (a: number, b: number) => a && b,
  '|': (a: number, b: number) => a | b,
  '^': (a: number, b: number) => a ^ b,
  '&': (a: number, b: number) => a & b,
  '==': (a: number, b: number) => Number(a == b),
  '!=': (a: number, b: number) => Number(a != b),
  '===': (a: number, b: number) => Number(a === b),
  '!==': (a: number, b: number) => Number(a !== b),
  '<': (a: number, b: number) => Number(a < b),
  '>': (a: number, b: number) => Number(a > b),
  '<=': (a: number, b: number) => Number(a <= b),
  '>=': (a: number, b: number) => Number(a >= b),
  '<<': (a: number, b: number) => a << b,
  '>>': (a: number, b: number) => a >> b,
  '>>>': (a: number, b: number) => a >>> b,
  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b,
  '%': (a: number, b: number) => a % b,
};

const unopsNum = {
  '-': (a: number) => -a,
  '+': (a: number) => +a,
  '~': (a: number) => ~a,
  '!': (a: number) => Number(!a),
};

const binopsVector = mapDictValues(binopsNum, createBinopVec);
const binopsNumVec = mapDictValues(binopsNum, createBinopNumVec);
const binopsVecNum = mapDictValues(binopsNum, createBinopVecNum);

const unopsVector = mapDictValues(unopsNum, createUnopVec);

function getBinop(operator: string, left: VecExprResult, right: VecExprResult) {
  const isLeftVec = isVecLike(left);
  const isRightVec = isVecLike(right);
  if (isLeftVec && isRightVec) {
    return binopsVector[operator];
  } else if (isLeftVec) {
    return binopsVecNum[operator];
  } else if (isRightVec) {
    return binopsNumVec[operator];
  } else {
    return binopsNum[operator];
  }
}

type AnyExpression =
  | jsep.ArrayExpression
  | jsep.BinaryExpression
  | jsep.MemberExpression
  | jsep.CallExpression
  | jsep.ConditionalExpression
  | jsep.Identifier
  | jsep.Literal
  | jsep.LogicalExpression
  | jsep.ThisExpression
  | jsep.UnaryExpression;

export function evaluate(_node: jsep.Expression, context: object) {
  const node = _node as AnyExpression;

  switch (node.type) {
    case 'BinaryExpression': {
      const left = evaluate(node.left, context);
      const right = evaluate(node.right, context);
      const binopFun = getBinop(node.operator, left, right);

      return binopFun(left, right);
    }

    case 'ConditionalExpression': {
      const val = evaluate(node.test, context);
      if (isVecLike(val)) {
        const length = val.length;
        const consequentVal = evaluate(node.consequent, context);
        const alternateVal = evaluate(node.alternate, context);
        const r = createResultArray(val);
        for (let i = 0; i < length; i++) {
          const entryVal = val[i] ? consequentVal : alternateVal;
          r[i] = isVecLike(entryVal) ? (entryVal[i] ?? NaN) : entryVal;
        }
        return r;
      } else {
        return val
          ? evaluate(node.consequent, context)
          : evaluate(node.alternate, context);
      }
    }

    case 'Identifier':
      return context[node.name];

    case 'Literal':
      return node.value;

    case 'LogicalExpression': {
      const left = evaluate(node.left, context);
      const right = evaluate(node.right, context);
      const binopFun = getBinop(node.operator, left, right);
      return binopFun(left, right);
    }

    case 'UnaryExpression': {
      const val = evaluate(node.argument, context);
      const unopFun = isVecLike(val)
        ? unopsVector[node.operator]
        : unopsNum[node.operator];
      return unopFun(val);
    }

    default:
      return undefined;
  }
}

const validResult = {valid: true};

function visit(_node: jsep.Expression, visitor: (node: AnyExpression) => void) {
  const node = _node as AnyExpression;

  visitor(node);
  switch (node.type) {
    case 'BinaryExpression': {
      visit(node.left, visitor);
      visit(node.right, visitor);
      break;
    }

    case 'ConditionalExpression': {
      visit(node.test, visitor);
      visit(node.consequent, visitor);
      visit(node.alternate, visitor);
      break;
    }

    case 'LogicalExpression': {
      visit(node.left, visitor);
      visit(node.right, visitor);
      break;
    }

    case 'UnaryExpression': {
      visit(node.argument, visitor);
      break;
    }
  }
}

const supportedExpressionTypes = [
  'BinaryExpression',
  'UnaryExpression',
  'ConditionalExpression',
  'LogicalExpression',
  'Identifier',
  'Literal',
];

function validate(_node: jsep.Expression, context: object): ValidationResult {
  const node = _node as AnyExpression;

  const errors: ValidationResult[] = [];

  visit(node, (node) => {
    if (!supportedExpressionTypes.includes(node.type)) {
      errors.push({
        valid: false,
        errorCode: ErrorCode.InvalidSyntax,
        errorMessage: `Not allowed`,
      });
      return;
    }
    if (node.type === 'Identifier') {
      if (!Object.prototype.hasOwnProperty.call(context, node.name)) {
        return errors.push({
          valid: false,
          errorCode: ErrorCode.UnknownIdentifier,
          errorMessage: `"${node.name}" not found`,
        });
      }
    }
    if (node.type === 'Literal') {
      // we actually support only numbers
      if (typeof node.value !== 'number') {
        return errors.push({
          valid: false,
          errorCode: ErrorCode.InvalidSyntax,
          errorMessage: `Only number literals are supported`,
        });
      }
    }
  });
  return errors.length ? errors[0] : validResult;
}

function getSymbols(node: jsep.Expression): string[] {
  const symbols = new Set<string>();

  visit(node, (node) => {
    if (node.type === 'Identifier') {
      symbols.add(node.name);
    }
  });
  return Array.from(symbols);
}

export function compile(expression: string | jsep.Expression) {
  return jsep(expression);
}
