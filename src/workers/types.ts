import type {Method} from './constants.js';

export type WorkerRequest = {
  requestId?: number;
  tableName: string; // TODO: Table name is not a unique identifier.
  method: Method;
  params: unknown[];
};

export type WorkerResponse =
  | {
      requestId: number;
      ok: true;
      result: unknown;
    }
  | {
      requestId: number;
      ok: false;
      error: string;
    };
