type VertexSpec = {
  header: string;
  contents: VertexContent[];
};

type VertexContent =
  | { label: string }
  | { plug: ValueType }
  | { jack: ValueType };

type ValueType = "number" | "label";

export class VertonTrack extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
    `;
    shadow.appendChild(style);
  }

  addVertex({ header, contents }: VertexSpec): void {
    this.shadowRoot!.append(VertonVertex.build(header, contents));
  }
}

customElements.define("verton-track", VertonTrack);

export class VertonVertex extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");

    const color = "red";

    style.textContent = `
      :host {
        display: block;
      }
      :host([hidden]) {
        display: none;
      }
      #inner {
        display: flex;
        flex-wrap: nowrap;
        flex-direction: column;
        justify-content: center;
        align-items: space-between;

        border: 5px solid ${color};
        border-radius: 7px;
        min-height: 15em;
        width: 15em;
      }
      #header {
        background-color: ${color};
        text-align: center;
        font-size: 170%;
        font-weight: bold;
        color: white;
      }
    `;
    shadow.appendChild(style);
  }

  static build(header: string, contents: VertexContent[]): VertonVertex {
    const o = new this();

    const c = document.createElement("div");
    c.id = "inner";

    const h = document.createElement("div");
    h.id = "header";
    h.innerText = header;

    c.append(h);

    o.shadowRoot!.append(c);
    return o;
  }
}

customElements.define("verton-vertex", VertonVertex);

export class VertonPlug extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    const div = document.createElement("div");
    div.append(document.createTextNode(this.dataset.label!));
    shadow.appendChild(div);

    const style = document.createElement("style");
    style.textContent = `
    `;
    shadow.appendChild(style);
  }
}

customElements.define("verton-plug", VertonPlug);

export class VertonJack extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
  }
}

customElements.define("verton-jack", VertonJack);

export class VertonStage extends HTMLElement {
  constructor() {
    super();

    // const shadow = this.attachShadow({ mode: "open" });
  }
}

customElements.define("verton-stage", VertonStage);

export class VertonObject extends HTMLElement {
  constructor() {
    super();

    // const shadow = this.attachShadow({ mode: "open" });
  }
}

customElements.define("verton-object", VertonObject);

const track = document.getElementsByTagName("verton-track")[0] as VertonTrack;

track.addVertex({
  header: "クリックしたら",
  contents: [
    { label: "X座標" },
    { plug: "number" },
    { label: "Y座標" },
    { plug: "number" },
  ],
});

track.addVertex({
  header: "足し算",
  contents: [
    { plug: "number" },
    { label: "+" },
    { plug: "number" },
    { label: "=" },
    { jack: "number" },
  ],
});

track.addVertex({
  header: "🐶",
  contents: [
    { label: "X座標" },
    { jack: "number" },
    { label: "Y座標" },
    { jack: "number" },
  ],
});
