import type { Env } from "$/env";

export const onRequest: PagesFunction<Env, "id"> = async ({
  params: { id },
}) => {
  const httpres = await fetch(`https://t.me/i/emoji/${id}.json`);
  if (!httpres.ok) return new Response(null, { status: 404 });
  const { emoji } = (await httpres.json()) as { emoji: string };
  const response = await fetch(emoji, { cf: { cacheTtl: 259_200 } });
  if (response.ok && response.status === 200) {
    return new Response(response.body, {
      headers: {
        ...response.headers,
        "Cache-Control": "public, max-age=259200",
      },
    });
  }
  return response;
};
