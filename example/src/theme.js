import { createStitches, globalCss } from '@stitches/react';

// const  = globalCss({globalStyles
//   '*, ::before, ::after': {
//     boxSizing: 'border-box',
//     borderWidth: '0',
//     borderStyle: 'solid',
//     borderColor: '#e5e7eb',
//   },
//   hr: { height: '0', color: 'inherit', borderTopWidth: '1px' },
//   'abbr[title]': {
//     WebkitTextDecoration: 'underline dotted',
//     textDecoration: 'underline dotted',
//   },
//   'b, strong': { fontWeight: 'bolder' },
//   'code, kbd, samp, pre': {
//     fontFamily: "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
//     fontSize: '1em',
//   },
//   small: { fontSize: '80%' },
//   'sub, sup': {
//     fontSize: '75%',
//     lineHeight: 0,
//     position: 'relative',
//     verticalAlign: 'baseline',
//   },
//   sub: { bottom: '-0.25em' },
//   sup: { top: '-0.5em' },
//   table: {
//     textIndent: '0',
//     borderColor: 'inherit',
//     borderCollapse: 'collapse',
//   },
//   'button, input, optgroup, select, textarea': {
//     fontSize: '100%',
//     margin: '0',
//     padding: '0',
//     lineHeight: 'inherit',
//     color: 'inherit',
//   },
//   'button, select': {},
//   "button, [type='button'], [type='reset'], [type='submit']": {},
//   '::-moz-focus-inner': { borderStyle: 'none', padding: '0' },
//   ':-moz-focusring': { outline: '1px dotted ButtonText' },
//   ':-moz-ui-invalid': { boxShadow: 'none' },
//   legend: { padding: '0' },
//   progress: { verticalAlign: 'baseline' },
//   '::-webkit-inner-spin-button, ::-webkit-outer-spin-button': {
//     height: 'auto',
//   },
//   "[type='search']": { WebkitAppearance: 'textfield', outlineOffset: '-2px' },
//   '::-webkit-search-decoration': { WebkitAppearance: 'none' },
//   '::-webkit-file-upload-button': {
//     WebkitAppearance: 'button',
//     font: 'inherit',
//   },
//   summary: { display: 'list-item' },
//   'blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre': {
//     margin: '0',
//   },
//   button: {
//     backgroundImage: 'none',
//     ':focus': {
//       outline: '1px dotted, 5px auto -webkit-focus-ring-color',
//     },
//   },
//   fieldset: { margin: '0', padding: '0' },
//   'ol, ul': { listStyle: 'none', margin: '0', padding: '0' },
//   img: { borderStyle: 'solid' },
//   textarea: { resize: 'vertical' },
//   'input::-moz-placeholder, textarea::-moz-placeholder': {
//     opacity: 1,
//     color: '#9ca3af',
//   },
//   'input:-ms-input-placeholder, textarea:-ms-input-placeholder': {
//     opacity: 1,
//     color: '#9ca3af',
//   },
//   'input::placeholder, textarea::placeholder': {
//     opacity: 1,
//     color: '#9ca3af',
//   },
//   "button, [role='button']": { cursor: 'pointer' },
//   'h1, h2, h3, h4, h5, h6': { fontSize: 'inherit', fontWeight: 'inherit' },
//   a: { color: 'inherit', textDecoration: 'inherit' },
//   'pre, code, kbd, samp': {
//     fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
//   },
//   'img, svg, video, canvas, audio, iframe, embed, object': {
//     display: 'block',
//     verticalAlign: 'middle',
//   },
//   'img, video': { maxWidth: '100%', height: 'auto' },
//   html: {
//     MozTabSize: '4',
//     OTabSize: '4',
//     tabSize: 4,
//     lineHeight: 1.5,
//     WebkitTextSizeAdjust: '100%',
//     fontFamily:
//       "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
//     width: '100%',
//     height: '100%',
//   },
//   body: {
//     margin: '0px',
//     fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
//     lineHeight: 1.4,
//     backgroundColor: 'white',
//     width: '100%',
//     height: '100%',
//     display: 'flex',
//     flexDirection: 'column',
//     flex: '1 1 0%',
//     minWidth: '320px',
//     minHeight: '100vh',
//     fontWeight: 400,
//     color: 'rgba(44, 62, 80, 1)',
//     direction: 'ltr',
//     fontSynthesis: 'none',
//     textRendering: 'optimizeLegibility',
//   },
// });

export const { styled, createTheme, getCssText } = createStitches({
  theme: {
    colors: {
      primary: 'blueviolet',
      secondary: 'gainsboro',
    }
  },
});
