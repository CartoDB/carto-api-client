// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import maplibregl from 'maplibre-gl';
import {Deck} from '@deck.gl/core';
import {getFetchMapConfig} from '@carto/api-client';

// const cartoMapId = 'ff6ac53f-741a-49fb-b615-d040bc5a96b8';
const cartoMapId = 'f8a942b2-0674-4a19-8dbc-2ffc987aa4c9';
const accessToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRVNGNZTHAwaThjYnVMNkd0LTE0diJ9.eyJodHRwOi8vYXBwLmNhcnRvLmNvbS9lbWFpbCI6ImphcmFnb25AY2FydG9kYi5jb20iLCJodHRwOi8vYXBwLmNhcnRvLmNvbS9hY2NvdW50X2lkIjoiYWNfeTBpc3NoaWoiLCJpc3MiOiJodHRwczovL2F1dGguY2FydG8uY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTA0MzMxMjQxMTYwMTYyNzU3ODM4IiwiYXVkIjpbImNhcnRvLWNsb3VkLW5hdGl2ZS1hcGkiLCJodHRwczovL2NhcnRvLXByb2R1Y3Rpb24udXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc0MTU2NjU3MSwiZXhwIjoxNzQxNjUyOTcxLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIHJlYWQ6Y3VycmVudF91c2VyIHVwZGF0ZTpjdXJyZW50X3VzZXIgcmVhZDpjb25uZWN0aW9ucyB3cml0ZTpjb25uZWN0aW9ucyByZWFkOm1hcHMgd3JpdGU6bWFwcyByZWFkOmFjY291bnQgYWRtaW46YWNjb3VudCIsImF6cCI6ImpDV25ISzZFMksyYU95OWpMeTNPN1pNcGhxR085QlBMIiwicGVybWlzc2lvbnMiOlsiYWRtaW46YWNjb3VudCIsImV4ZWN1dGU6d29ya2Zsb3dzIiwicmVhZDphY2NvdW50IiwicmVhZDphY2NvdW50X3VzZXJzIiwicmVhZDphcHBzIiwicmVhZDpjb25uZWN0aW9ucyIsInJlYWQ6Y3VycmVudF91c2VyIiwicmVhZDppbXBvcnRzIiwicmVhZDpsaXN0ZWRfYXBwcyIsInJlYWQ6bWFwcyIsInJlYWQ6dGlsZXNldHMiLCJyZWFkOnRva2VucyIsInJlYWQ6d29ya2Zsb3dzIiwidXBkYXRlOmN1cnJlbnRfdXNlciIsIndyaXRlOmFwcHMiLCJ3cml0ZTpjYXJ0by1kdy1ncmFudHMiLCJ3cml0ZTpjb25uZWN0aW9ucyIsIndyaXRlOmltcG9ydHMiLCJ3cml0ZTpsaXN0ZWRfYXBwcyIsIndyaXRlOm1hcHMiLCJ3cml0ZTp0b2tlbnMiLCJ3cml0ZTp3b3JrZmxvd3MiXX0.THlmGyj-APr24udsMa9KnL8iCIGSNqTiqymHzQJSkaJxqMuItam-4ZQ5EdYsf91bNu-90_a-Th5wtQEo9BDSGbhXaEFvaSWWo9LheUz7xo7yduVjKwUAFrmgMazdGIsoyi6V9BHQN4DDF7rTGmy5mdNX1Hd6vZFJEzGPTDqTUisoalhto4xp2p2RaGnNx8WbsSAwh9X6PFJtL_0sedt84OmewRoojexCeKHZFI3EF0Eh1nmumEcLbOtvnWpip7IBFaZapfzUykSXZbEsPzfIqC80EeBLi-h_zaEop1dff3Epz8tNG_ficG5QhE_PYccwdXstSfijY1NF4g3h7qrMDA';

// Get map info from CARTO and update deck
// fetchMap({cartoMapId}).then(({initialViewState, basemap, layers}) => {
//   const deck = new Deck({canvas: 'deck-canvas', controller: true, initialViewState, layers});

//   // Add Mapbox GL for the basemap. It's not a requirement if you don't need a basemap.
//   const map = new maplibregl.Map({container: 'map', ...basemap?.props, interactive: false});
//   deck.setProps({
//     onViewStateChange: ({viewState}) => {
//       const {longitude, latitude, ...rest} = viewState;
//       map.jumpTo({center: [longitude, latitude], ...rest});
//     }
//   });
// });

await getFetchMapConfig({cartoMapId, accessToken});
