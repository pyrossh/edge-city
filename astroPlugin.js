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
  name: "Astro",
  async setup(build) {
    build.onLoad({ filter: /\.astro$/ }, async (args) => {
      const folder = path.dirname(args.path).replace(process.cwd(), "");
      const filename = path.basename(args.path).replace("astro", "js");
      const outputFolder = path.join(process.cwd(), ".cache", folder);
      const outputFile = path.join(outputFolder, filename);
      const text = readFileSync(args.path, "utf8");
      const [_, js, html, css] = text.split("---");
      const imports = js.split("\n").filter((line) => line.startsWith("import")).join("\n");
      const body = js.split("\n").filter((line) => !line.startsWith("import")).join("\n");
      const tpl = `
        ${imports}

        export default () => {
          ${body}

          return (
            ${html}
          );
        }
      `;
      // console.log('tpl', tpl);
      const code = await transpiler.transform(tpl);
      // console.log('code', code);
      if (!existsSync(outputFolder)) {
        mkdirSync(outputFolder);
      }
      writeFileSync(outputFile, code);
      if (css) {
        const result = postcss([
          autoprefixer(),
          postcssCustomMedia(),
          // postcssNormalize({ browsers: 'last 2 versions' }),
          postcssNesting(),
        ]).process(css, { from: 'src/app.css', to: 'dest/app.css' });
        writeFileSync(path.join(outputFolder, filename.replace("js", "css")), result.css);
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
