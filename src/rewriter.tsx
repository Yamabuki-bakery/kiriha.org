import { TextHandler } from "./TextHandler";
import { h, renderToString } from "./jsx";

function transformURL(url: string) {
  const parsed = new URL(url.startsWith("//") ? "https:" + url : url);
  return new URL(`/p/${parsed.host}${parsed.pathname}`, "https://example.com/")
    .pathname;
}

function transformHref(link: string) {
  return "/?" + link.split("?")[1];
}

type Context = {
  siteName: string;
  twitterSite: string;
};

export function createRewriter(context: Context): HTMLRewriter {
  const rewriter = new HTMLRewriter().on("time[datetime]", {
    element(element) {
      element.tagName = "me-time";
    },
  });
  header_process(rewriter, context);
  message_emoji_process(rewriter);
  message_link_process(rewriter);
  message_photo_process(rewriter);
  message_video_process(rewriter);
  group_process(rewriter);
  post_process(rewriter);
  return rewriter;
}

function header_process(
  rewriter: HTMLRewriter,
  { siteName, twitterSite }: Context
) {
  let channel_title = "";
  let channel_username = "";
  let channel_description = "";
  let channel_photo = "";
  let last_value = 0;
  const counters = new Map<string, number>();
  rewriter
    .on("head", {
      element(element) {
        counters.clear();
        element.onEndTag((end) => {
          end.before(`<link rel="stylesheet" href="/style.css">`, {
            html: true,
          });
          end.before(`<script type="module" src="/index.js"></script>`, {
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
          (channel_photo = transformURL(element.getAttribute("content")!))
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
                <img
                  class="tgme_page_photo_image"
                  alt={`${channel_username}'s avatar`}
                  src={channel_photo}
                />
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
              <section
                class="tgme_channel_info_description"
                dangerouslySetInnerHTML={{ __html: channel_description }}
              />
            ),
            { html: true }
          );
        });
      },
    });
}

function message_emoji_process(rewriter: HTMLRewriter) {
  rewriter.on("tg-emoji[emoji-id]", {
    element(element) {
      const id = element.getAttribute("emoji-id")!;
      element.before(
        `<i class="emoji" style="background-image: url('/i/emoji/${id}')"></i>`,
        { html: true }
      );
      element.remove();
    },
  });
}

function message_link_process(rewriter: HTMLRewriter) {
  rewriter.on(
    'a.tgme_widget_message_link_preview[href^="https://telegra.ph/"]',
    {
      element(element) {
        const href = element.getAttribute("href");
        if (!href) return;
        element.setAttribute(
          "href",
          "/h/" + href.slice("https://telegra.ph/".length)
        );
      },
    }
  );
}

function message_photo_process(rewriter: HTMLRewriter) {
  let image_width = 0;
  let image_ratio = 0;
  rewriter
    .on(".tgme_widget_message_photo_wrap", {
      element(element) {
        try {
          const style = element.getAttribute("style")!;
          const classname = element.getAttribute("class")!;
          image_width = extractWidthFromStyle(style);
          const url = extractBackgroundFromStyle(style);
          const transformed = transformURL(url);
          element.removeAttribute("style");
          element.onEndTag((end) => {
            const style = `aspect-ratio: ${image_width} / ${
              (image_width * image_ratio) / 100
            }`;
            const img = (
              <img
                class="tgme_widget_message_photo"
                src={transformed}
                loading="lazy"
                alt="Message photo"
                style={style}
              />
            );
            if (classname.includes(" blured ")) {
              end.before(
                renderToString(
                  <me-img src={transformed} style={style}>
                    {img}
                  </me-img>
                ),
                { html: true }
              );
            } else {
              end.before(renderToString(img), { html: true });
            }
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
        image_ratio = extractPaddingTopFromStyle(style);
      },
    })
    .on(".link_preview_right_image, .link_preview_image", {
      element(element) {
        element.tagName = "img";
        const style = element.getAttribute("style")!;
        const url = extractBackgroundFromStyle(style);
        const transformed = transformURL(url);
        element.removeAttribute("style");
        element.setAttribute("src", transformed);
        element.setAttribute("loading", "lazy");
        element.setAttribute("alt", "Link preview image");
      },
    });
}

function message_video_process(rewriter: HTMLRewriter) {
  let video_source = "";
  let video_ratio = 0;
  let video_duration = "";
  rewriter
    .on(".tgme_widget_message_video_player", {
      element(element) {
        element.onEndTag((end) => {
          end.before(
            renderToString(
              <me-video class="tgme_widget_message_video">
                <img
                  class="tgme_widget_message_video_thumb"
                  src={video_source}
                  loading="lazy"
                  style={`aspect-ratio: 100 / ${video_ratio}`}
                />
                <time class="tgme_widget_message_video_duration">
                  {video_duration}
                </time>
              </me-video>
            ),
            { html: true }
          );
        });
      },
    })
    .on(".tgme_widget_message_video_player .tgme_widget_message_video_thumb", {
      element(element) {
        element.remove();
        const style = element.getAttribute("style")!;
        const url = extractBackgroundFromStyle(style);
        video_source = transformURL(url);
      },
    })
    .on(".tgme_widget_message_video_player .tgme_widget_message_video_wrap", {
      element(element) {
        const style = element.getAttribute("style")!;
        video_ratio = extractPaddingTopFromStyle(style);
      },
    })
    .on(
      ".tgme_widget_message_video_player .message_video_duration",
      new TextHandler((text) => {
        video_duration = text;
      })
    )
    .on(".tgme_widget_message_video_player > *", {
      element(element) {
        element.remove();
      },
    });
}

function group_process(rewriter: HTMLRewriter) {
  rewriter
    .on(".tgme_widget_message_grouped_wrap, .tgme_widget_message_grouped", {
      element(element) {
        element.removeAndKeepContent();
      },
    })
    .on(".grouped_media_helper", {
      element(element) {
        element.remove();
      },
    })
    .on(".tgme_widget_message_grouped_layer", {
      element(element) {
        element.tagName = "me-grouped";
        element.setAttribute("class", "tgme_widget_message_grouped");
        element.removeAttribute("style");
      },
    });
}

function post_process(rewriter: HTMLRewriter) {
  rewriter
    .on("img", {
      element(element) {
        element.setAttribute("loading", "lazy");
        element.setAttribute("src", transformURL(element.getAttribute("src")!));
      },
    })
    .on('[style*="background-image:url"]', {
      element(element) {
        const style = element.getAttribute("style");
        if (!style) return;
        const replaced = style.replaceAll(
          /(?<=background-image:url\(')([^']+)/g,
          transformURL
        );
        element.setAttribute("style", replaced);
      },
    });
}

function extractWidthFromStyle(style: string) {
  return +style.match(/(?<=width:)[^]+?(?=px)/g)![0];
}
function extractPaddingTopFromStyle(style: string) {
  return +style.match(/(?<=padding-top:)[^]+?(?=%)/g)![0];
}
function extractBackgroundFromStyle(style: string) {
  return style.match(/(?<=background-image:url\(')[^']+/g)![0];
}
