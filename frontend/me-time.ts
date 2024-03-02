import { formatRelative, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

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
      locale: zhCN,
    });
  }
}

customElements.define("me-time", MeTime);
