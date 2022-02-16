type VertexView = {
  header: string;
  plugContents?: PlugContent[];
  configContents?: [key: string];
  jackContents?: JackContent[];
  colors?: Partial<Colors>;
};

type Colors = {
  window: string;
  label: string;
  header: string;
  point: string;
  background: string;
};

type CurrentlyDrawing = {
  edge: Edge.Type;
  from: Point;
};

type VertexId = number;

type JackName = string;
type PlugName = string;

type JackId = { vertexId: VertexId; jackName: JackName };
type PlugId = { vertexId: VertexId; plugName: PlugName };

type PagePointer = {
  pageX: number;
  pageY: number;
};

type Point = {
  x: number;
  y: number;
};

type LabelContent = { label: string };
type JackNameContent = { jackName: JackName; label?: string };
type PlugNameContent = { plugName: PlugName; label?: string };
type JackContent = LabelContent | JackNameContent;
type PlugContent = LabelContent | PlugNameContent;

type Rect = Omit<DOMRect, "x" | "y" | "toJSON">;

const SVG_NS = "http://www.w3.org/2000/svg";

const componentClasses: { [elementName: string]: { new (): HTMLElement } } = {};

const BACKGROUND_COLOR = "#FFDD58";

const CLOSE_BUTTON_ID = "closeButton";

export class VertonGarage extends HTMLElement {
  private _lastVertexId: VertexId = 0;
  private _currentlyDrawing: CurrentlyDrawing | undefined = undefined;
  readonly closeButton: CloseButton;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host {
        height: 2000px;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-around;
        background-color: ${BACKGROUND_COLOR};
      }
      .edge {
        position: absolute;
        pointer-events: none;
      }
      #${CLOSE_BUTTON_ID} {
        position: absolute;
      }
    `;
    shadow.appendChild(style);

    const vertexesContainer = document.createElement("div");
    vertexesContainer.id = "vertexes";
    shadow.appendChild(vertexesContainer);

    const edgesContainer = document.createElement("div");
    edgesContainer.id = "edges";
    shadow.appendChild(edgesContainer);

    this.closeButton = CloseButton.buildHidden(CLOSE_BUTTON_ID);
    shadow.appendChild(this.closeButton.element);

    this.addEventListener("pointermove", (e) => {
      if (this._currentlyDrawing === undefined) {
        return;
      }
      e.preventDefault();
      const p1 = this._currentlyDrawing.from;
      const p2 = {
        x: e.pageX,
        y: e.pageY,
      };
      Edge.moveTo(this._currentlyDrawing.edge, p1, p2);
    });

    this.addEventListener("pointerdown", () => {
      this.closeButton.hide();
      this.cancelDrawingEdge();
    });
  }

  addVertex(spec: VertexView): void {
    const specFilled = Object.assign(
      { plugContents: [], configContents: [], jackContents: [], colors: {} },
      spec
    );
    this._getVertexesContainer().append(
      VertonVertex.build(this._generateNewId(), specFilled, this)
    );
  }

  startDrawingEdge(
    from: PlugId,
    centerOfPlug: Point,
    clickedPoint: PagePointer
  ) {
    const edgesContainer = this._getEdgesContainer();
    const edge = Edge.create(
      from,
      centerOfPlug,
      clickedPoint,
      this.closeButton
    );
    this._currentlyDrawing = { edge, from: centerOfPlug };
    edgesContainer.append(edge);
  }

  finishDrawingEdge(to: JackId, p2: Point) {
    if (this._currentlyDrawing === undefined) {
      return;
    }
    const p1 = this._currentlyDrawing.from;
    Edge.moveTo(this._currentlyDrawing.edge, p1, p2);
    Edge.connectTo(this._currentlyDrawing.edge, to);
    this._currentlyDrawing = undefined;
  }

  cancelDrawingEdge() {
    if (this._currentlyDrawing === undefined) {
      return;
    }
    this._getEdgesContainer().removeChild(this._currentlyDrawing.edge);
    this._currentlyDrawing = undefined;
  }

  raiseToTop(vertex: VertonVertex) {
    this._getVertexesContainer().appendChild(vertex);
  }

  isDrawingEdge(): boolean {
    return this._currentlyDrawing !== undefined;
  }

  private _generateNewId(): VertexId {
    const id = this._lastVertexId;
    this._lastVertexId++;
    return id;
  }

  private _getVertexesContainer(): HTMLElement {
    return this.shadowRoot!.getElementById("vertexes")!;
  }

  private _getEdgesContainer(): HTMLElement {
    return this.shadowRoot!.getElementById("edges")!;
  }
}

componentClasses["verton-garage"] = VertonGarage;

export namespace Edge {
  export type Type = SVGElement;

  export function create(
    { vertexId, plugName }: PlugId,
    centerOfPlug: Point,
    { pageX, pageY }: PagePointer,
    closeButton: CloseButton
  ): Type {
    const {
      top,
      left,
      width,
      height,
      x1,
      y1,
      x2,
      y2,
    } = calcEdgeDef(centerOfPlug, { x: pageX, y: pageY });

    const edge = document.createElementNS(SVG_NS, "svg");
    edge.classList.add("edge");
    edge.style.left = `${left}px`;
    edge.style.top = `${top}px`;
    edge.setAttribute("width", `${width}px`);
    edge.setAttribute("height", `${height}px`);
    edge.dataset.fromVertexId = vertexId.toString();
    edge.dataset.fromPlugId = plugName.toString();

    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", `${x1}`);
    line.setAttribute("y1", `${y1}`);
    line.setAttribute("x2", `${x2}`);
    line.setAttribute("y2", `${y2}`);
    line.setAttribute("stroke", "#FF1BB6");
    line.setAttribute("stroke-width", "4px");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("pointer-events", "stroke");
    line.setAttribute("fill", "none");
    line.addEventListener("pointerup", (e) => {
      e.preventDefault();
      if (hasConnectedToAny(edge)) {
        const { left, width, top, height } = getBoundingPageRect(edge);
        closeButton.show({
          at: { x: left + width / 2, y: top + height / 2 },
          for: () => [edge],
        });
      }
    });
    edge.append(line);

    return edge;
  }

  export function moveTo(edge: Edge.Type, p1: Point, p2: Point) {
    const { top, left, width, height, x1, y1, x2, y2 } = calcEdgeDef(p1, p2);

    edge.style.left = `${left}px`;
    edge.style.top = `${top}px`;

    edge.style.width = `${width}px`;
    edge.style.height = `${height}px`;

    const line = edge.firstChild as SVGLineElement;
    line.setAttribute("x1", `${x1}`);
    line.setAttribute("y1", `${y1}`);
    line.setAttribute("x2", `${x2}`);
    line.setAttribute("y2", `${y2}`);
  }

  export function connectTo(edge: Type, { vertexId, jackName }: JackId) {
    edge.dataset.toVertexId = vertexId.toString();
    edge.dataset.toJackId = jackName;
  }

  export function hasConnectedToAny(edge: Type): boolean {
    return !!(edge.dataset.toVertexId && edge.dataset.toJackId);
  }

  // Public only for testing
  export function calcEdgeDef(
    p1: Point,
    p2: Point
  ): {
    top: number;
    left: number;
    width: number;
    height: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } {
    if (p2.x > p1.x) {
      if (p2.y > p1.y) {
        return {
          left: p1.x,
          top: p1.y,
          x1: 0,
          y1: 0,
          x2: p2.x - p1.x,
          y2: p2.y - p1.y,
          width: p2.x - p1.x,
          height: p2.y - p1.y,
        };
      } else if (p2.y == p1.y) {
        return {
          left: p1.x,
          top: p2.y,
          x1: 0,
          y1: 2,
          x2: p2.x - p1.x,
          y2: 2,
          width: p2.x - p1.x,
          height: 3,
        };
      } else {
        return {
          left: p1.x,
          top: p2.y,
          x1: 0,
          y1: p1.y - p2.y,
          x2: p2.x - p1.x,
          y2: 0,
          width: p2.x - p1.x,
          height: p1.y - p2.y,
        };
      }
    } else if (p2.x == p1.x) {
      if (p2.y > p1.y) {
        return {
          left: p1.x,
          top: p1.y,
          x1: 2,
          y1: 0,
          x2: 2,
          y2: p2.y - p1.y,
          width: 3,
          height: p2.y - p1.y,
        };
      } else {
        return {
          left: p2.x,
          top: p2.y,
          x1: 2,
          y1: 0,
          x2: 2,
          y2: p1.y - p2.y,
          width: 3,
          height: p1.y - p2.y,
        };
      }
    } else {
      if (p2.y > p1.y) {
        return {
          left: p2.x,
          top: p1.y,
          x1: p1.x - p2.x,
          y1: 0,
          x2: 0,
          y2: p2.y - p1.y,
          width: p1.x - p2.x,
          height: p2.y - p1.y,
        };
      } else if (p2.y == p1.y) {
        return {
          left: p2.x,
          top: p1.y,
          x1: 0,
          y1: 2,
          x2: p1.x - p2.x,
          y2: 2,
          width: p1.x - p2.x,
          height: 3,
        };
      } else {
        return {
          left: p2.x,
          top: p2.y,
          x1: 0,
          y1: 0,
          x2: p1.x - p2.x,
          y2: p1.y - p2.y,
          width: p1.x - p2.x,
          height: p1.y - p2.y,
        };
      }
    }
  }

  export function findPlugWith(
    garageRoot: ShadowRoot,
    edge: Type
  ): Plug.Type | undefined {
    const vertex = garageRoot.querySelector(
      `[data-vertex-id="${edge.dataset.fromVertexId}"]`
    ) as VertonVertex | null;
    return vertex?.findPlugOf(edge.dataset.fromPlugId!);
  }

  export function findJackWith(
    garageRoot: ShadowRoot,
    edge: Type
  ): Jack.Type | undefined {
    const vertex = garageRoot.querySelector(
      `[data-vertex-id="${edge.dataset.toVertexId}"]`
    ) as VertonVertex | null;
    return vertex?.findJackOf(edge.dataset.toJackId!);
  }
}

export class VertonVertex extends HTMLElement {
  private _garage: VertonGarage | undefined = undefined;
  private _movingFrom: Point | undefined = undefined;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");

    this.addEventListener("pointerdown", (e) => {
      this._onPointerDown(e);
    });
    this.addEventListener("pointermove", (e) => {
      this._onPointerMove(e);
    });
    this.addEventListener("pointerup", (e) => {
      this._onPointerUp(e);
    });

    style.textContent = `
      :host {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        position: absolute;

        --height: 15em;
        --width: 17em;
        --header-height: 1.6em;

        --color-window: #FF0C4C;
        --color-label: #FF0C4C;
        --color-header: white;
        --color-point: #C00;
        --color-background: ${BACKGROUND_COLOR};

        min-height: var(--height);
        min-width: var(--width);
      }
      :host([hidden]) { display: none; }

      #inner {
        border-top: 5px solid var(--color-window);
        border-bottom: 5px solid var(--color-window);
        border-left: 5px solid var(--color-window);
        border-right: 5px solid var(--color-window);
        border-radius: 15px;
        background-color: var(--color-background);

        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        justify-content: flex-start;

        min-height: var(--height);
        min-width: var(--width);
      }

      #header {
        background-color: var(--color-window);
        border-radius: 7px 7px 0 0;
        text-align: left;
        transform: scale(101%, 103%);
        font-size: var(--header-height);
        font-weight: bold;
        color: var(--color-header);
      }

      #upper-right-corner {
        height: calc(var(--header-height) * 1.53);
      }

      #jacks-jack-labels-plug-labels {
        display: flex;
        flex-grow: 1;
        flex-direction: row;
        justify-content: space-between;
      }

      #jacks-jack-labels {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }

      #plugs-outer {
        display: flex;
        flex-direction: column;
      }

      #jacks, #plugs {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }
      #plugs { flex-grow: 1; }
      #jack-labels, #plug-labels {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        min-width: 1.5em;
      }
      #jack-labels { align-items: flex-start; }
      #plug-labels { align-items: flex-end; }

      .label {
        color: var(--color-label);
        font-weight: bold;
        padding: 0 0.5em;
      }

      .jack-or-plug {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 0.65em;
        height: 1.3em;
        background-color: var(--color-background);
        border-radius: 0 1.3em 1.3em 0;
        border: 5px solid var(--color-window);
        border-left: 6px solid var(--color-background);
        margin-left: -5px;
      }

      .jack-or-plug-point {
        width: 0.4em;
        height: 0.4em;
        border-radius: 0.5em;
        background-color: var(--color-point);
      }

      #Config-container {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }
      .config {
        display: block;
        font-size: 1.4em;
        width: calc(var(--width) * 0.4);
      }
    `;
    shadow.appendChild(style);
  }

  private _onPointerDown(e: PointerEvent) {
    e.preventDefault();
    this._garage!.closeButton!.hide();
    this._movingFrom = {
      x: e.pageX,
      y: e.pageY,
    };
    this._garage!.raiseToTop(this);
    this.setPointerCapture(e.pointerId);
  }

  private _onPointerMove(e: PointerEvent) {
    e.preventDefault();
    if (!this._movingFrom) {
      return;
    }

    const newX = e.pageX;
    const newY = e.pageY;
    const dx = newX - this._movingFrom.x;
    const dy = newY - this._movingFrom.y;

    this._movingFrom.x = newX;
    this._movingFrom.y = newY;

    const rect = getBoundingPageRect(this);
    const newLeft = rect.left + dx;
    const newTop = rect.top + dy;

    const {
      left: garageLeft,
      right: garageRight,
      top: garageTop,
      bottom: garageBottom,
    } = getBoundingPageRect(this._garage!);

    const newLeftClamped = Math.min(
      Math.max(newLeft, garageLeft),
      garageRight - rect.width
    );
    const newTopClamped = Math.min(
      Math.max(newTop, garageTop),
      garageBottom - rect.height
    );

    this.style.left = `${newLeftClamped}px`;
    this.style.top = `${newTopClamped}px`;

    this._moveEdgesWithPlugs();
    this._moveEdgesWithJacks();
  }

  private _onPointerUp(e: PointerEvent) {
    const { right: x, top: y } = getBoundingPageRect(
      this.shadowRoot!.getElementById("inner")!
    );
    this._garage!.closeButton!.show({
      at: { x, y },
      for: () => {
        const toDelete: Element[] = [this];
        this._forEdgesWithPlugs((edge) => {
          toDelete.push(edge);
        });
        this._forEdgesWithJacks((edge) => {
          toDelete.push(edge);
        });
        return toDelete;
      },
    });
    this._movingFrom = undefined;
    this.releasePointerCapture(e.pointerId);
  }

  static build(
    vertexId: VertexId,
    {
      header,
      plugContents,
      jackContents,
      configContents,
      colors,
    }: Required<VertexView>,
    garage: VertonGarage
  ): VertonVertex {
    const obj = new this();
    const r = obj.shadowRoot!;
    obj._garage = garage;

    obj.setColors(colors);

    const inner = document.createElement("div");
    inner.id = "inner";

    const headerElem = document.createElement("div");
    headerElem.id = "header";
    headerElem.innerText = header;
    inner.append(headerElem);

    const jacksJackLabelsPlugLabels = document.createElement("div");
    jacksJackLabelsPlugLabels.id = "jacks-jack-labels-plug-labels";
    inner.append(jacksJackLabelsPlugLabels);

    obj.dataset.vertexId = vertexId.toString();

    obj._appendJacks(vertexId, jackContents, jacksJackLabelsPlugLabels, garage);

    VertonVertex._appendConfigInputs(configContents, jacksJackLabelsPlugLabels);

    r.append(inner);

    obj._appendPlugs(vertexId, plugContents, jacksJackLabelsPlugLabels, garage);

    return obj;
  }

  setColors(colors: Partial<Colors>) {
    if (colors.window) {
      this.style.setProperty("--color-window", colors.window);
    }
    if (colors.label) {
      this.style.setProperty("--color-label", colors.label);
    }
    if (colors.header) {
      this.style.setProperty("--color-header", colors.header);
    }
    if (colors.point) {
      this.style.setProperty("--color-point", colors.point);
    }
    if (colors.background) {
      this.style.setProperty("--color-background", colors.background);
    }
  }

  findPlugOf(plugId: string): Plug.Type | undefined {
    const result = this.shadowRoot!.querySelector(`[data-plug-id="${plugId}"]`);
    return result as Plug.Type | undefined;
  }

  findJackOf(jackId: string): Jack.Type | undefined {
    const result = this.shadowRoot!.querySelector(`[data-jack-id="${jackId}"]`);
    return result as Jack.Type | undefined;
  }

  getConfiguredValue(key: string): number | undefined {
    const v = this.shadowRoot!.getElementById(`config-${key}`);
    if (!v) {
      throw new Error(`No config found for ${JSON.stringify(key)}`);
    }
    const n = Number((v as HTMLInputElement).value);
    if (isNaN(n)) {
      console.warn(`Invalid config value ${JSON.stringify(n)}`);
      return undefined;
    }
    return n;
  }

  private _appendJacks(
    vertexId: VertexId,
    jackContents: JackContent[],
    container: HTMLDivElement,
    garage: VertonGarage
  ) {
    const jacksElem = document.createElement("div");
    jacksElem.id = "jacks";

    const labels = document.createElement("div");
    labels.id = "jack-labels";

    for (let jackId = 0; jackId < jackContents.length; ++jackId) {
      const jack = jackContents[jackId];
      const hasJackName = "jackName" in jack;
      if (hasJackName) {
        const jackName = (jack as JackNameContent).jackName;
        jacksElem.append(Jack.build({ vertexId, jackName }, garage));
      }

      const hasLabel = "label" in jack;
      if (hasLabel) {
        const labelElem = document.createElement("div");
        labelElem.className = "label";
        labelElem.innerText = jack.label!;
        labels.append(labelElem);
      }

      if (!hasJackName && !hasLabel) {
        console.error(`Unkown object in jackContents:`, jack);
      }
    }

    const jacksJackLabels = document.createElement("div");
    jacksJackLabels.id = "jacks-jack-labels";

    jacksJackLabels.append(jacksElem);
    jacksJackLabels.append(labels);
    container.append(jacksJackLabels);
  }

  private _appendPlugs(
    vertexId: VertexId,
    plugContents: PlugContent[],
    container: HTMLElement,
    garage: VertonGarage
  ) {
    const r = this.shadowRoot!;

    const plugsOuter = document.createElement("div");
    plugsOuter.id = "plugs-outer";

    const upperRightCorner = document.createElement("div");
    upperRightCorner.id = "upper-right-corner";
    plugsOuter.append(upperRightCorner);

    const plugsElem = document.createElement("div");
    plugsElem.id = "plugs";
    plugsOuter.append(plugsElem);

    const labels = document.createElement("div");
    labels.id = "plug-labels";

    for (let plugId = 0; plugId < plugContents.length; ++plugId) {
      const plug = plugContents[plugId];
      const hasPlugName = "plugName" in plug;
      if (hasPlugName) {
        const plugName = (plug as PlugNameContent).plugName;
        plugsElem.append(Plug.build({ vertexId, plugName }, garage));
      }

      const hasLabel = "label" in plug;
      if (hasLabel) {
        const labelElem = document.createElement("div");
        labelElem.className = "label";
        labelElem.innerText = plug.label!;
        labels.append(labelElem);
      }

      if (!hasPlugName && !hasLabel) {
        console.error(`Unkown object in plugContents:`, plug);
      }
    }

    container.append(labels);

    r.append(plugsOuter);
  }

  private _moveEdgesWithPlugs() {
    const garageRoot = this._garage!.shadowRoot!;
    this._forEdgesWithPlugs((edge, plug) => {
      const centerOfPlug = JackOrPlug.centerOf(plug);
      const jack = Edge.findJackWith(garageRoot, edge);
      if (!jack) {
        console.error(
          `Could not find a jack with ${edge.dataset.toVertexId} ${edge.dataset.toJackId}`
        );
        return;
      }
      const centerOfJack = JackOrPlug.centerOf(jack);
      Edge.moveTo(edge, centerOfPlug, centerOfJack);
    });
  }

  private _moveEdgesWithJacks() {
    const garageRoot = this._garage!.shadowRoot!;
    this._forEdgesWithJacks((edge, jack) => {
      const centerOfJack = JackOrPlug.centerOf(jack);
      const plug = Edge.findPlugWith(garageRoot, edge);
      if (!plug) {
        console.error(
          `Could not find a plug with ${edge.dataset.toVertexId} ${edge.dataset.toPlugId}`
        );
        return;
      }
      const centerOfPlug = JackOrPlug.centerOf(plug as Plug.Type);
      Edge.moveTo(edge, centerOfJack, centerOfPlug);
    });
  }

  private _forEdgesWithPlugs(body: (edge: Edge.Type, plug: Plug.Type) => void) {
    const garageRoot = this._garage!.shadowRoot!;
    const plugs = Array.from(
      this.shadowRoot!.getElementById("plugs")!.children
    );
    for (const plug_ of plugs) {
      const plug = plug_ as Plug.Type;
      const selector = `[data-from-vertex-id="${this.dataset.vertexId}"][data-from-plug-id="${plug.dataset.plugId}"]`;
      for (const edge_ of Array.from(garageRoot.querySelectorAll(selector))) {
        body(edge_ as Edge.Type, plug);
      }
    }
  }

  private _forEdgesWithJacks(body: (edge: Edge.Type, jack: Jack.Type) => void) {
    const garageRoot = this._garage!.shadowRoot!;
    const jacks = Array.from(
      this.shadowRoot!.getElementById("jacks")!.children
    );
    for (const jack_ of jacks) {
      const jack = jack_ as Jack.Type;
      const selector = `[data-to-vertex-id="${this.dataset.vertexId}"][data-to-jack-id="${jack.dataset.jackId}"]`;
      for (const edge_ of Array.from(garageRoot.querySelectorAll(selector))) {
        body(edge_ as Edge.Type, jack);
      }
    }
  }

  private static _appendConfigInputs(
    configContents: string[],
    container: HTMLElement
  ) {
    const div = document.createElement("div");
    div.id = "Config-container"; // Capitalize the id to avoid name conflicts.
    for (const key of configContents) {
      const input = document.createElement("input");
      input.setAttribute("type", "number");
      input.setAttribute("value", "0");
      input.id = `config-${key}`;
      input.classList.add("config");

      // Prevent the parent vertex from taking focus by setPointerCapture
      input.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });

      div.appendChild(input);
    }
    container.appendChild(div);
  }
}

componentClasses["verton-vertex"] = VertonVertex;

namespace JackOrPlug {
  export function build(): HTMLElement {
    const elem = document.createElement("div");
    elem.className = "jack-or-plug";

    const point = document.createElement("div");
    point.className = "jack-or-plug-point";
    elem.append(point);

    return elem;
  }

  export function centerOf(elem: HTMLElement): Point {
    const rect = getBoundingPageRect(elem);
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }
}

namespace Plug {
  export type Type = HTMLElement;

  export function build(id: PlugId, garage: VertonGarage): Type {
    const elem = JackOrPlug.build();
    elem.dataset.plugId = id.plugName.toString();

    elem.addEventListener("pointerdown", (e) => {
      if (garage.isDrawingEdge()) {
        return;
      }
      e.stopPropagation();
      const centerOfPlug = JackOrPlug.centerOf(elem);
      garage.startDrawingEdge(id, centerOfPlug, e);
    });

    return elem;
  }
}

namespace Jack {
  export type Type = HTMLElement;

  export function build(id: JackId, garage: VertonGarage): Type {
    const elem = JackOrPlug.build();
    elem.dataset.jackId = id.jackName;

    elem.addEventListener("pointerup", (e) => {
      if (!garage.isDrawingEdge()) {
        return;
      }
      e.stopPropagation();
      garage.finishDrawingEdge(id, JackOrPlug.centerOf(elem));
    });
    elem.addEventListener("pointerdown", (e) => {
      if (!garage.isDrawingEdge()) {
        return;
      }
      e.stopPropagation();
      garage.finishDrawingEdge(id, JackOrPlug.centerOf(elem));
    });

    return elem;
  }
}

const CLOSE_BUTTON_RADIUS = 20;

class CloseButton {
  readonly element: SVGElement;
  private _collectTargets: (() => Element[]) | undefined = undefined;

  constructor(id: string) {
    this.element = document.createElementNS(SVG_NS, "svg");
    this.element.id = id;
    const padding = 3;
    const lineWidth = 2;
    const radius = CLOSE_BUTTON_RADIUS;

    const diagonalLineLengthHalf = Math.sqrt(2) * radius;
    const d1 =
      (diagonalLineLengthHalf - radius) * (radius / diagonalLineLengthHalf) +
      padding;

    const diagonalLineLength = diagonalLineLengthHalf * 2;
    const diameter = radius * 2;
    const d2 =
      (diameter * (radius + diagonalLineLengthHalf)) / diagonalLineLength -
      padding;

    this.element.setAttribute("width", `${radius * 2}px`);
    this.element.setAttribute("height", `${radius * 2}px`);
    this.element.innerHTML = `
    <circle cx="${radius}" cy="${radius}" r="${radius}" fill="#a9a9a9"></circle>
    <line x1="${d1}" y1="${d1}" x2="${d2}" y2="${d2}" stroke-linecap="round" stroke-width="${lineWidth}" stroke="#fff"></line>
    <line x1="${d1}" y1="${d2}" x2="${d2}" y2="${d1}" stroke-linecap="round" stroke-width="${lineWidth}" stroke="#fff"></line>
    `;

    this.element.style.display = "none";

    this.element.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    this.element.addEventListener("pointerup", (e) => {
      e.stopPropagation();
    });
    this.element.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this._collectTargets === undefined) {
        console.warn("CloseButton: target not set");
        return;
      }
      for (const target of this._collectTargets()) {
        target.parentNode?.removeChild(target);
      }
      this.hide();
    });
  }

  static buildHidden(id: string): CloseButton {
    const closeButton = new this(id);
    closeButton.hide();
    return closeButton;
  }

  show({ at: { x, y }, for: elem }: ShowParams) {
    const radius = CLOSE_BUTTON_RADIUS;
    this.element.style.left = `${x - radius}px`;
    this.element.style.top = `${y - radius}px`;
    this.element.style.display = "block";
    this._collectTargets = elem;
  }

  hide() {
    this.element.style.display = "none";
  }
}

type ShowParams = {
  at: Point;
  for: () => Element[];
};

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

componentClasses["verton-object"] = VertonObject;

export function activateWebComponents() {
  for (const [elementName, componentClass] of Object.entries(
    componentClasses
  )) {
    customElements.define(elementName, componentClass);
  }
}

function getBoundingPageRect(elem: Element): Rect {
  const originalRect = elem.getBoundingClientRect();

  return {
    left: originalRect.left + window.scrollX,
    top: originalRect.top + window.scrollY,
    right: originalRect.right + window.scrollX,
    bottom: originalRect.bottom + window.scrollY,
    width: originalRect.width,
    height: originalRect.height,
  };
}
