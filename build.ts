import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function* walkDir(path: string): AsyncGenerator<string> {
  const dirents = await readdir(path, { withFileTypes: true });
  for (const dirent of dirents) {
    const finalPath = join(path, dirent.name);
    if (dirent.isDirectory()) {
      yield* walkDir(finalPath);
    } else {
      yield finalPath;
    }
  }
}

const entrypoints: string[] = [];

for await (const path of walkDir("./functions")) {
  entrypoints.push(path);
}

const result = await Bun.build({
  entrypoints,
  outdir: "public/functions",
  target: "node",
});
if (result.logs.length) {
  console.log(result.logs);
}
if (!result.success) {
  process.exit(1);
}
