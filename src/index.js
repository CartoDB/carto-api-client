import { PublicClient } from './clients/public';
import { AuthenticatedClient } from './clients/authenticated';
import { ApiClientError } from './errors/api-client';

/**
 *
 * @namespace CartoApiClient
 * @summary JavaScript client for cartodb API
 *
 * @description
 *
 * This is the entry point for carto-api-client.
 *
 * This client enables interaction with the cartodb API by using REST requests.
 * There are two clients: PublicClient and AuthenticatedClient.
 * To interact with the API, you need to have a CARTO account.
 * In order to do so, you have to provide your account base url, which has the format https://username.carto.com or https://organization.carto.com/u/username.
 * In addition, you have to be authenticated to obtain private information.
 *
 * It can be used both in the server and the client side.
 *
 * @param {Object} staticConfig
 * @param {string} staticConfig.baseUrl - User base url
 *
 * @requires module:whatwg-fetch
 *
 * @example
 * var CartoApiClient = require('carto-api-client');
 * var client = CartoApiClient.AuthenticatedClient.setConfig({
 *   baseUrl: 'foobar.com',
 *   apiKey: '1234567' // optional
 * });
 *
 * client.getUser()
 *   .then(console.log)
 *   .catch(console.error);
 *
 */

export default { PublicClient, AuthenticatedClient, ApiClientError };
