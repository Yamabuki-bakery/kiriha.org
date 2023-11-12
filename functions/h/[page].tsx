import { Env } from "$/env";
import { Node, h, renderToString } from "$/jsx";

type TelegraphAPIResponse<T> =
  | {
      ok: true;
      result: T;
    }
  | {
      ok: false;
      error: string;
    };

type TelegraphPage = {
  path: string;
  url: string;
  title: string;
  description: string;
  author_name: string;
  author_url: string;
  views: number;
  content: HtmlNode[];
};

type HtmlNode = {
  tag: string;
  attrs: { [key: string]: string };
  children?: (HtmlNode | string)[];
};

function renderHtmlNode(node: HtmlNode | string): Node {
  return typeof node === "string" ? <>{node}</> : createTag(node);
}
function createTag(node: HtmlNode): Node<any> {
  if (node.tag === "img") {
    if (node.attrs.src.startsWith("https://telegra.ph/file/"))
      return <img src={"/p/telegra.ph" + node.attrs.src} loading="lazy" />;
    return <img src={node.attrs.src} loading="lazy" />;
  }
  return h(node.tag, node.attrs, ...(node.children?.map(renderHtmlNode) ?? []));
}

export const onRequest: PagesFunction<Env, "page"> = async ({ params }) => {
  const url = new URL("https://api.telegra.ph/");
  url.pathname = `/getPage/${params.page}`;
  url.searchParams.set("return_content", "true");
  const httpres = await fetch(url);
  if (!httpres.ok) return new Response(null, { status: 404 });
  const response =
    (await httpres.json()) as TelegraphAPIResponse<TelegraphPage>;
  if (!response.ok) return new Response(response.error, { status: 400 });
  const result = response.result;
  let html = "<!DOCTYPE html>";
  html += renderToString(
    <html>
      <head>
        <meta charset="utf-8" />
        <title>{result.title}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="MobileOptimized" content="176" />
        <meta name="HandheldFriendly" content="True" />
        <meta property="og:title" content={result.title} />
        <meta property="og:description" content={result.description} />
        <meta property="twitter:title" content={result.title} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:description" content={result.description} />
        <link rel="canonical" href={result.url} />
        <link rel="stylesheet" href="/telegraph.css" />
      </head>
      <body>
        <header>
          <h1>{result.title}</h1>
          <div class="info">
            <div class="author">
              {result.author_url ? (
                <a href={result.author_url} target="_blank">
                  {result.author_name}
                </a>
              ) : (
                result.author_name
              )}
            </div>
            <div class="views">{result.views}</div>
          </div>
        </header>
        <article>{result.content.map(renderHtmlNode)}</article>
      </body>
    </html>
  );
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
};
