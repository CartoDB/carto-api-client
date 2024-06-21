import {CLIENT_ID} from './constants.js';

/**
 * Default client
 * @internalRemarks Source: @carto/react-core
 */
let client = CLIENT_ID;

/** @internalRemarks Source: @carto/react-core */
export function getClient() {
  return client;
}

/** @internalRemarks Source: @carto/react-core */
export function setClient(c: string) {
  client = c;
}
