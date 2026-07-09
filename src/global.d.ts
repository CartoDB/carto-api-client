/** Defined by @deck.gl/core. */
declare const deck: {VERSION: string | undefined} | undefined;

/** Defined by tsup. */
declare const TSUP_FORMAT: 'esm' | 'cjs';

/** SVG assets imported as inline data URLs (tsup `dataurl` loader). */
declare module '*.svg' {
  const dataUrl: string;
  export default dataUrl;
}
