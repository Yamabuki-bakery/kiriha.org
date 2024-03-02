import css from "./me-img.css";

class MeImg extends HTMLElement {
  #shadow: ShadowRoot = this.attachShadow({ mode: "open" });
  #image = document.createElement("img");
  static get observedAttributes() {
    return ["src"];
  }

  get src() {
    return this.#image.getAttribute("src")!;
  }

  set src(src: string) {
    this.#image.setAttribute("src", src);
  }

  constructor() {
    super();
    this.#shadow.innerHTML = `<style>${css}</style><slot></slot>`;
    this.#shadow.appendChild(this.#image);
  }

  connectedCallback() {
    if (!this.src) return;
    this.#image.src = this.src;
  }
}

customElements.define("me-img", MeImg);
