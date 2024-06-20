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
export function setClient(c: string) {
  client = c;
}
