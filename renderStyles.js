import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// import { ServerStyleSheet, StyleSheetManager } from 'styled-components/dist/styled-components.esm';
// import { renderStylesToNodeStream } from '@emotion/server';

const CLOSING_TAG_R = /^\s*<\/[a-z]/i;

export const renderStyles = () => {
  const sheet = new ServerStyleSheet();
  const instance = sheet.instance;
  // renderStylesToNodeStream();
  return {
    // createStylesTransformer() {
    //   sealed = true;
    //   return new TransformStream({
    //     transform(chunk, controller) {
    //       // Get the chunk and retrieve the sheet's CSS as an HTML chunk,
    //       // then reset its rules so we get only new ones for the next chunk
    //       const renderedHtml = new TextDecoder().decode(chunk);
    //       const html = _emitSheetCSS();

    //       // instance.clearTag();
    //       console.log(html)

    //       // prepend style html to chunk, unless the start of the chunk is a
    //       // closing tag in which case append right after that
    //       if (CLOSING_TAG_R.test(renderedHtml)) {
    //         const endOfClosingTag = renderedHtml.indexOf('>') + 1;
    //         const before = renderedHtml.slice(0, endOfClosingTag);
    //         const after = renderedHtml.slice(endOfClosingTag);
    //         controller.enqueue(new TextEncoder().encode(before + html + after))
    //       } else {
    //         controller.enqueue(new TextEncoder().encode(html + renderedHtml));
    //       }
    //     },
    //     flush(controller) {
    //       console.log(_emitSheetCSS());
    //     },
    //   });
    // }
  }
}