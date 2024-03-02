import { formatRelative, parseISO } from "date-fns";
import * as locales from "date-fns/locale";

const getLocale = (): locales.Locale | undefined => {
  const locale = navigator.language.replace("-", "");
  const rootLocale = locale.substring(0, 2);

  // @ts-ignore
  return locales[locale] || locales[rootLocale];
};

class MeTime extends HTMLElement {
  static get observedAttributes() {
    return ["datetime"];
  }

  get datetime() {
    return this.getAttribute("datetime")!;
  }

  set datetime(datetime: string) {
    this.setAttribute("datetime", datetime);
  }

  connectedCallback() {
    if (!this.datetime) return;
    this.innerHTML = formatRelative(parseISO(this.datetime), new Date(), {
      locale: getLocale(),
    });
  }
}

customElements.define("me-time", MeTime);
