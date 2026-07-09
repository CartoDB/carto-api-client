// Fill-pattern sprite atlas (Phase 2 — line/polygon fill patterns).
//
// Inlined as a base64 data URL so it ships inside the compiled bundle with no asset
// file and no HTTP request (hence no CORS surface) — the same mechanism api-client
// already uses for FALLBACK_ICON. deck.gl decodes the string and uploads the GPU
// texture lazily, only when a FillStyleExtension layer actually draws a pattern.
//
// 7 patterns x 3 densities = 21 sprites, plus a `solid` (opaque) and a `none`
// (transparent) cell = 23, each 64x64. Every cell is `mask: true`, so the sprite is a
// stencil tinted by getFillColor: opaque texels paint the fill color, transparent
// texels leave gaps. `none` must be a real transparent sprite — a null pattern key
// resolves to atlas bounds [0,0,0,0] and samples the wrong (0,0) cell.
export const PATTERN_ATLAS_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAIACAYAAADUq2OaAAALUElEQVR42u3d0ZKbRhCGUb3/S2+u7Nq4VlohAWL6O/9tgLiUPsB0D87tSyScm59AABABQJIFUI8CEAAAEBEREREREZHp0QQRAAAQAAAQEREREe/A3oEFAAAEAAAEAABE3ADcAAQAAAQAAETcAdwBBAAABAAABAAABAAABAAARMQN0A1QAABAAQgAACgAAQAAAQAAEREREREREU0ATQABAAABAAARERERERERXQDRBQFAAABA5OUbgJ9AAPAK4A0AAABEREREREREREREZFy0wQUAAAQAAETcAfaWcfXrv/vnmnR+8jgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACYCqBS/Ft+OMU/9Lhy8X+/juKPHlcu/j/XUvzh48rFv8e/f+r5GSSKX/HXnxCKX/ErfsWv+ItrA8Wv+NML43Txb/kxFb/Xo3HF/2xRKH7FP7L4712ztD1C8YeL/6fr1vYGKf5w8f977frGOMUfK/7v11f8il/xK37Fr/gVv+KPFP+7P9QEPPWWaLr4n20DTm6Vlov/4Q7RypdivgcwDMsW/x7XX/18xa/4s8X/7Cug4lf8Y7tFil/xZ4tfS1TxK/5y8d8rIMWv+DNrA8Wv+LPFv+lAxa/4Bx7n7wVS/Nni/wtA8St+8wDFr/gdp/hre4MUv+JPfw+g+BW/4lf8ir96vuJX/P7/AIpf8Ttf8eeK/9WOieIPfBNcKP5X++WKf/g3wYpf8VsbKH7Fr/gV//QFs+JX/OlukeJX/Fqlil/xK37Fr/gVv+JX/Ipf8St+xR85TvEr/mzx3wVQKf7Nj8qBeMrF/yOAUvH/704QLP4t1xh7XLn4v98FFX/09ahc/Hv8+xX/4scp/m7xWxgfWByKX/ErfsWv+BW/4lf8iv+y11f83eJ/q5amTJAVf7f4X66nSdsnFL/PIrPF/9s3sopf8Y8u/n+vXdwYp/jDxf/9+tVdoYpf8dsSXS5+3wO0i98aAAIIIIAAAnMACCAwCYYAAl0fCCCAAAIIIIAAAgggmIvAJBiCNAJ7gSBIIzAEiyOovtNDAEF+YQuBL8J0d8J3eN8EQ+D/FD954QrB7+d714fAxzAQQAABBBD4JriHoDTMguC1dmDiSzAImgjyQ7DitgYIIPh7XHVvDwQQ/AgAAghSk+D6Lk8ItD4hgAACCCCAAAIIIICghMBHMHEEPoqBII3ARzEQpBH4HsB2iDQCW6Gbxb3p94IAgqnHZbs3EECQb2E+Wg9AAEECwfTuDgQQbP5RIIAgg2Byi/OZ87U+4wgm38mfnYRDEEYw/XVmy5oHAggggAACCDoI/L1AEKQR+HuBIGi/5tQ/eqlvhc6/69e//Kp/D5Bf8NY/f/Q9QLzrU/8GuL7tAQII0gj0/yFIIzAEgwACCCCAwDfBEEDgm2AIILDhDQIIIIAAAggggAACCOYi0PqMIyjcyR+dr/8fR1A/3xAMgvz3ABBAkP8ewCQYgvxW6PQ3wbo7XoeSx726KHp3wXWV6++JZ8L5ueOOKtKvJ/Pp6+993ornP7qDTj/udkSRfm3MJ69/byH46LxHQ6XVzq+juP32I+79WF7t+vV/Pv216Pbsj7Dn68RVrz/xDr/nEyLV799aRKsfP/kd/93fbfQTYPIdfWKX5sjzk2uA2ju9OcHPr8DZLtC0rs7W69efAPk5wLS+/tFriGlrABvhhk12j5h8Tu4CeQIcfCe9+vX1+a0B0k8AfX5doPQaoL4XyOtOvAtUnxNY8MbnANP7/Gc1CkyCF50EewJYAxzaN7/68fU1QL4LNHFvz5br17tA+TnA9Hf6vff+TJwDpCfBujomwZ4Ag/v6nxrKrbQXKL8GmDbZPWtyPO38ZBdo2t6es/cOTTs/NwfwBPAESE+CrQHaawBPAF2gdBfIGsAcID8HMAk2CTYJrs4Bjmih2Qu05vkWxgPu6FvPK3Z5qnf2l36rae/0r742TJ4TpNcAxa7OXtefcH6+C6Sv314DeN0x2fW3Qljwnrc94GrX9889AdJPAJNga4D0GqDU57+HQhco3AWq9fl/m4OYA8TmAIU+/5bXHpPg2CTYE8AT4NB35lWOtwaIrgEm3tGPeu3RBRrYBZq+t2fvd35zgGGvO/W9PSbB8QXv9L09Ry007QUKPAEKk+N6l8gaYNjeHn3+7efnu0CeAOYE2TmANUB7DZCfBOsC+VshPAHMAfJ9fpNgk2CT4GIXaK93Y3uBZpyfmwNMvqNP7NKccX5tYZx6pzcn0Bo9rOW4YtfIE8AaYFRf/+g1xLQ1QL4LNG2ye8TjfXIXKD8HOPpOevXrmwPEJ8H1J4BJsCdAeg1gL5A1QLoLVJ8T6AKJiIiIbHo1mHKcHPgjrnR+sSukwndoE045H4ALPFY+ff13u0Srnv/s8dOOO+WOuNL1qwA8AQ76D3L16wMAwFs/5jtFeoXr7/nnWf18XaAXf8xXivQq1/cEEAAAEAAAkDeKc68+9dnXNwewBvAEOHAuYRK8aBcIAE9+AADw2lueBNfmABB4ApxeRFebBAMAwO5dhenXnwgh3wU69aIXvn6pCySyyxNj9fNF8ZsECwBVANYAAPgeQBdI8de+BwBAfBNsEgyAVyBPAAAAAAAC3wPoAp2sxiT4WufLzV4gUfx2g4ri9z1A5797fg3gizA3PJ9EAgAAAP5WiEIXyCT4zeLcq0999vWP6Bqter4ngCeASTAAAPgeQBcIAF+ESW0OUP8eQD5wR7naJNgTQHbvSqx0fQCsAc6/6IWurwukC+SJZw4AgOzzI5kELzgJFk8+TwABAADx2qcLJCIi4nUgd75YDGbmANYAF7ijmASbBF+uC2QvEABZAHaDNgCYBL/4Y/oeYPb52SeAL8K8AgEAgO8Bql0gAHwRpg9+UJFe6frmAOIJcOBcwiQYgKUBVP/bWwMA4KZX6AJ9vZlPrjfO/Pe73uPzVz0eAAAAAAAAAAAAAAAAAAAAAAAAAKABoFLod48HAAAAAAAAAAAAACAHABQAAAAAAACaALRBAQAAAAAAAAAAAHoAKm1MWxwAAAAAAAAAQBv0A+/GAAAAwAUB2AoBAAAAAAAAAAAAAAAAAFgsa4MCAAAAAAAAAAAAAAAAAAAAAAAAtkLYCqENCgAAU46vFPBZf04AAAAAAAAAAAAAAAAAAIArXy/fBgUAAAAAAAAAAAAAIAfA4hYAAAAAAIAmAG1QAAAAAAAAAAAAAAAAAAAAAACIdYfGF/BZf05t0MXaoAAAAEAYgK0QAAAAAAAAAAAAAAAAAIB2qTYoAAAAAAAAAAAAAAAAuB4AALgeALZC2AqhDQoAAAAAAAAAAACwNoCveG7SDgACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACBT8h+smE3rrqIcJwAAAABJRU5ErkJggg==';

export type PatternAtlasFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  mask: boolean;
};

export const PATTERN_ATLAS_MAPPING: Record<string, PatternAtlasFrame> = {
  'hlines-large': {x: 0, y: 0, width: 64, height: 64, mask: true},
  'hlines-medium': {x: 64, y: 0, width: 64, height: 64, mask: true},
  'hlines-small': {x: 128, y: 0, width: 64, height: 64, mask: true},
  'vlines-large': {x: 0, y: 64, width: 64, height: 64, mask: true},
  'vlines-medium': {x: 64, y: 64, width: 64, height: 64, mask: true},
  'vlines-small': {x: 128, y: 64, width: 64, height: 64, mask: true},
  'diag-left-large': {x: 0, y: 128, width: 64, height: 64, mask: true},
  'diag-left-medium': {x: 64, y: 128, width: 64, height: 64, mask: true},
  'diag-left-small': {x: 128, y: 128, width: 64, height: 64, mask: true},
  'diag-right-large': {x: 0, y: 192, width: 64, height: 64, mask: true},
  'diag-right-medium': {x: 64, y: 192, width: 64, height: 64, mask: true},
  'diag-right-small': {x: 128, y: 192, width: 64, height: 64, mask: true},
  'cross-hatch-large': {x: 0, y: 256, width: 64, height: 64, mask: true},
  'cross-hatch-medium': {x: 64, y: 256, width: 64, height: 64, mask: true},
  'cross-hatch-small': {x: 128, y: 256, width: 64, height: 64, mask: true},
  'dots-large': {x: 0, y: 320, width: 64, height: 64, mask: true},
  'dots-medium': {x: 64, y: 320, width: 64, height: 64, mask: true},
  'dots-small': {x: 128, y: 320, width: 64, height: 64, mask: true},
  'checker-large': {x: 0, y: 384, width: 64, height: 64, mask: true},
  'checker-medium': {x: 64, y: 384, width: 64, height: 64, mask: true},
  'checker-small': {x: 128, y: 384, width: 64, height: 64, mask: true},
  solid: {x: 0, y: 448, width: 64, height: 64, mask: true},
  none: {x: 64, y: 448, width: 64, height: 64, mask: true},
};
