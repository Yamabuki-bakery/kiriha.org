const router = new Bun.FileSystemRouter({
  dir: "functions",
  style: "nextjs",
});

console.log(router.routes);

const result = await Bun.build({
  entrypoints: Object.values(router.routes),
  outdir: "public/functions",
  target: "node",
});
if (result.logs.length) {
  console.log(result.logs);
}
