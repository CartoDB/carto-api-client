import type {Method} from './constants.js';

export type WorkerRequest = {
  requestId?: number;
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
