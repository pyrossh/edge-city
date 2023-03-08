import { plugin } from "bun";

const transpiler = new Bun.Transpiler({
  loader: "jsx",
  autoImportJSX: true,
  jsxOptimizationInline: true,
});

plugin({
  name: "Astro",
  async setup(build) {
    const { readFileSync, writeFileSync } = await import("fs");
    build.onLoad({ filter: /\.astro$/ }, async (args) => {
      const text = readFileSync(args.path, "utf8");
      const [_, js, html] = text.split("---");
      const imports = js.split("\n").filter((line) => line.startsWith("import")).join("\n");
      const body = js.split("\n").filter((line) => !line.startsWith("import")).join("\n");
      const code = await transpiler.transform(`
        ${imports}

        export default () => {
          ${body}

          return (
            ${html}
          );
        }
      `);
      // console.log('code', code);
      writeFileSync("./dist/index.js", code)
      const src = await import("./dist/index.js");
      return {
        exports: {
          default: src.default,
        },
        loader: "object",
      };
    });
  },
});
