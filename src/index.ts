export * from './client.js';
export * from './constants.js';
export * from './deck/index.js';
export * from './fetch-map/index.js';
export {
  createVecExprEvaluator as _createVecExprEvaluator,
  evaluateVecExpr as _evaluateVecExpr,
  validateVecExprSyntax as _validateVecExprSyntax,
  type VecExprResult as _VecExprResult,
  ErrorCode as _ErrorCode,
} from './fetch-map/vec-expr-evaluator.js';
export * from './filters.js';
export * from './geo.js';
export * from './sources/index.js';
export * from './widget-sources/index.js';
export * from './types.js';

export {
  type APIErrorContext,
  type APIRequestType,
  CartoAPIError,
  type QueryOptions,
  buildPublicMapUrl, // Internal, but required for fetchMap().
  buildStatsUrl, // Internal, but required for fetchMap().
  query,
  requestWithParameters,
  clearDefaultRequestCache, // Internal, for unit testing.
} from './api/index.js';

export {_getHexagonResolution} from './spatial-index.js';

// For unit testing only.
export * from './filters/index.js';
export * from './operations/index.js';
export * from './utils/makeIntervalComplete.js';
export * from './utils/transformToTileCoords.js';
export * from './utils/CellSet.js';
export * from './fetch-map/source.js';
