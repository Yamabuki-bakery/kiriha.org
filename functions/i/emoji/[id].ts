import type { Env } from "$/env";

export const onRequest: PagesFunction<Env, "id"> = async ({
  params: { id },
}) => {
  const httpres = await fetch(`https://t.me/i/emoji/${id}.json`);
  if (!httpres.ok) return new Response(null, { status: 404 });
  const { emoji } = (await httpres.json()) as { emoji: string };
  return await fetch(emoji, { cache: "force-cache" });
};
