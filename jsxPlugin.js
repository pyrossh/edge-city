import { plugin } from "bun";
import path from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import postcss from "postcss"
import autoprefixer from "autoprefixer";
import postcssCustomMedia from "postcss-custom-media";
// import postcssNormalize from 'postcss-normalize';
import postcssNesting from "postcss-nesting";

const transpiler = new Bun.Transpiler({
  loader: "jsx",
  autoImportJSX: true,
  jsxOptimizationInline: true,
});

plugin({
  name: "JsxPlugin",
  async setup(build) {
    build.onLoad({ filter: /\.jsx$/ }, async (args) => {
      const folder = path.dirname(args.path).replace(process.cwd(), "");
      const filename = path.basename(args.path).replace("jsx", "js");
      const cssFile = args.path.replace("jsx", "css");
      const outputFolder = path.join(process.cwd(), ".cache", folder);
      const outputFile = path.join(outputFolder, filename);
      const jsxCode = readFileSync(args.path, "utf8");
      const code = await transpiler.transform(jsxCode);
      // console.log('code', code);
      if (!existsSync(outputFolder)) {
        mkdirSync(outputFolder);
      }
      writeFileSync(outputFile, code);
      if (existsSync(cssFile)) {
        const cssText = readFileSync(cssFile, "utf-8");
        const result = postcss([
          autoprefixer(),
          postcssCustomMedia(),
          // postcssNormalize({ browsers: 'last 2 versions' }),
          postcssNesting,
        ]).process(cssText);
        writeFileSync(outputFile.replace("js", "css"), result.css);
      }
      const src = await import(outputFile);
      return {
        exports: {
          default: src.default,
        },
        loader: "object",
      };
    });
  },
});
