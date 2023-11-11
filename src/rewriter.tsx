import { TextHandler } from "./TextHandler";
import { h, renderToString } from "./jsx";

function transformURL(url: string, baseURL: string) {
  const parsed = new URL(url.startsWith("//") ? "https:" + url : url);
  return new URL(`/p/${parsed.host}${parsed.pathname}`, baseURL).toString();
}

function transformHref(link: string) {
  return "/?" + link.split("?")[1];
}

export function createRewriter({
  baseURL,
  siteName,
  twitterSite,
}: {
  baseURL: string;
  siteName: string;
  twitterSite: string;
}): HTMLRewriter {
  let channel_title = "";
  let channel_username = "";
  let channel_description = "";
  let channel_photo = "";
  let last_value = 0;
  let image_width = 0;
  let image_ratio = 0;
  const counters = new Map<string, number>();
  return new HTMLRewriter()
    .on("head", {
      element(element) {
        counters.clear();
        element.onEndTag((end) => {
          end.before(`<link rel="stylesheet" href="/style.css">`, {
            html: true,
          });
        });
      },
    })
    .on(
      "title",
      new TextHandler(
        (title) => (channel_title = title.replace(/ – Telegram$/g, ""))
      )
    )
    .on('meta[property="og:description"]', {
      element(element) {
        channel_description = element.getAttribute("content")!;
      },
    })
    .on('meta[property="og:image"],meta[property="twitter:image"]', {
      element(element) {
        element.setAttribute(
          "content",
          (channel_photo = transformURL(
            element.getAttribute("content")!,
            baseURL
          ))
        );
      },
    })
    .on('meta[property="og:site_name"]', {
      element(element) {
        element.setAttribute("content", siteName);
      },
    })
    .on('meta[property="twitter:site"], meta[name="twitter:site"]', {
      element(element) {
        if (twitterSite) element.setAttribute("content", twitterSite);
        else element.remove();
      },
    })
    .on('meta[property^="al:"]', {
      element(element) {
        element.remove();
      },
    })
    .on('link[rel="prev"], link[rel="canonical"]', {
      element(element) {
        element.setAttribute(
          "href",
          transformHref(element.getAttribute("href")!)
        );
      },
    })
    .on("script", {
      element(element) {
        element.remove();
      },
    })
    .on('link[rel="icon"][type="image/svg+xml"]', {
      element(element) {
        element.setAttribute("type", "image/jpeg");
        element.setAttribute("href", channel_photo);
      },
    })
    .on(
      'link[rel="icon"][type="image/png"],link[rel="apple-touch-icon"],link[rel="alternate icon"]',
      {
        element(element) {
          element.remove();
        },
      }
    )
    .on('link[rel="stylesheet"]', {
      element(element) {
        element.remove();
      },
    })
    .on("form.tgme_header_search_form", {
      element(element) {
        element.setAttribute("action", "/");
      },
    })
    .on("a.tgme_header_search_form_clear", {
      element(element) {
        element.setAttribute("href", "/");
      },
    })
    .on(
      ".tgme_main, .tgme_container, .tgme_widget_message_wrap, .tgme_widget_message_bubble",
      {
        element(element) {
          element.removeAndKeepContent();
        },
      }
    )
    .on(
      ".tgme_channel_download_telegram, .tgme_background_wrap, .tgme_header_search, .tgme_footer, .tgme_widget_message_user, .tgme_widget_message_bubble_tail",
      {
        element(element) {
          element.remove();
        },
      }
    )
    .on(".tgme_widget_message", {
      element(element) {
        element.removeAttribute("data-view");
      },
    })
    .on(
      ".tgme_channel_info_counter .counter_value",
      new TextHandler((text) => {
        last_value = +text;
      })
    )
    .on(
      ".tgme_channel_info_header_username a",
      new TextHandler((text) => {
        channel_username = text;
      })
    )
    .on(
      ".tgme_channel_info_counter .counter_type",
      new TextHandler((text) => {
        counters.set(text, last_value);
      })
    )
    .on(".tgme_header", {
      element(element) {
        element.setAttribute("class", "tgme_header");
        element.setInnerContent("", { html: true });
        element.onEndTag((end) => {
          end.before(
            renderToString(
              <>
                <img class="tgme_page_photo_image" src={channel_photo} />
                <div class="tgme_channel_info_header_title_wrap">
                  <div class="tgme_channel_info_header_title">
                    {channel_title}
                  </div>
                  <div class="tgme_channel_info_header_username">
                    {channel_username}
                  </div>
                </div>
                <div class="tgme_channel_info_counters">
                  {[...counters.entries()].map(([type, value]) => (
                    <div class="tgme_channel_info_counter">
                      <div class="counter_type">{type}</div>
                      <div class="counter_value">{value}</div>
                    </div>
                  ))}
                </div>
              </>
            ),
            { html: true }
          );
          end.after(
            renderToString(
              <section class="tgme_channel_info_description">
                {channel_description}
              </section>
            ),
            { html: true }
          );
        });
      },
    })
    .on("img", {
      element(element) {
        element.setAttribute("loading", "lazy");
        element.setAttribute(
          "src",
          transformURL(element.getAttribute("src")!, baseURL)
        );
      },
    })
    .on(".tgme_widget_message_photo_wrap", {
      element(element) {
        try {
          const style = element.getAttribute("style")!;
          image_width = +style.match(/(?<=width:)[^]+(?=px)/g)![0];
          const url = style.match(/(?<=background-image:url\(')[^']+/g)![0];
          const transformed = transformURL(url, baseURL);
          element.removeAttribute("style");
          element.onEndTag((end) => {
            end.before(
              renderToString(
                <img
                  class="tgme_widget_message_photo"
                  src={transformed}
                  loading="lazy"
                  style={`aspect-ratio: ${image_width} / ${
                    image_width * image_ratio / 100
                  }`}
                />
              ),
              { html: true }
            );
          });
        } catch {
          element.remove();
        }
      },
    })
    .on(".tgme_widget_message_photo_wrap > .tgme_widget_message_photo", {
      element(element) {
        element.remove();
        const style = element.getAttribute("style")!;
        image_ratio = +style.match(/(?<=padding-top:)[^]+(?=%)/g)![0];
      },
    })
    .on(".link_preview_right_image, .link_preview_image", {
      element(element) {
        element.tagName = "img";
        const style = element.getAttribute("style")!;
        const url = style.match(/(?<=background-image:url\(')[^']+/g)![0];
        const transformed = transformURL(url, baseURL);
        element.removeAttribute("style");
        element.setAttribute("src", transformed);
        element.setAttribute("loading", "lazy");
      },
    })
    .on('[style*="background-image:url"]', {
      element(element) {
        const style = element.getAttribute("style");
        if (!style) return;
        const replaced = style.replaceAll(
          /(?<=background-image:url\(')([^']+)/g,
          (url) => transformURL(url, baseURL)
        );
        element.setAttribute("style", replaced);
      },
    });
}
