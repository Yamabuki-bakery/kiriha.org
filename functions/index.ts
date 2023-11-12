import { Env } from "$/env";
import { LazyInit } from "$/lazyinit";
import { createRewriter } from "$/rewriter";

const lazy_rewriter = new LazyInit(createRewriter);

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const rewriter = lazy_rewriter.get({
    siteName: env.SiteName,
    twitterSite: env.TwitterSite,
  });
  const target_url = `https://t.me/s/${env.TargetChannelId}`;
  const response = await fetch(target_url);
  if (!response.ok) return new Response(null, { status: 500 });
  const res = rewriter.transform(response);
  return new Response(await res.text(), {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
};
