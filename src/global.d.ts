/** Defined by @deck.gl/core. */
declare const deck: {VERSION: string | undefined} | undefined;

/** Defined by tsup. */
declare const TSUP_FORMAT: 'esm' | 'cjs';

/** Pattern assets imported as inline data URLs (tsup `dataurl` loader). */
declare module '*.png' {
  const dataUrl: string;
  export default dataUrl;
}
declare module '*.svg' {
  const dataUrl: string;
  export default dataUrl;
}
