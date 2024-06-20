/**
 * Default client
 * @internalRemarks Source: @carto/react-core
 */
let client = 'c4react';

/** @internalRemarks Source: @carto/react-core */
export function getClient() {
  return client;
}

/** @internalRemarks Source: @carto/react-core */
export function setClient(c) {
  client = c;
}

/** @internalRemarks Source: @carto/react-core */
export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/** @internalRemarks Source: @carto/react-core */
const NAME = 'InvalidColumnError';

/** @internalRemarks Source: @carto/react-core */
const ERR_START_MESSAGE = `${NAME}: `;

/** @internalRemarks Source: @carto/react-core */
export class InvalidColumnError extends Error {
  constructor(message) {
    super(`${ERR_START_MESSAGE}${message}`);
    this.name = NAME;
  }

  static is(error) {
    return (
      error instanceof InvalidColumnError ||
      error.message?.includes(ERR_START_MESSAGE)
    );
  }
}
