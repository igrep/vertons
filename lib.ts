export type VertonGarageJsObject = {
  vertexes: Required<VertonVertexJsObject>[];
  edges: Edge.JsObject[];
};

export type VertonVertexJsObject = {
  _id: VertexId;
  header: string;
  plugs?: PlugJsObject[];
  config?: Config;
  jacks?: JackJsObject[];
  colors?: Partial<Colors>;
  position?: Point;
};

type Config = { [key: string]: number };

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

export type VertexId = number;

export type JackId = string;
export type PlugId = string;

// GW: Garage-Wide
export type GwPlugId = { vertexId: VertexId; plugId: PlugId };
export type GwJackId = { vertexId: VertexId; jackId: JackId };

type PagePointer = {
  pageX: number;
  pageY: number;
};

type Point = {
  x: number;
  y: number;
};

export type LabelContent = { label: string };
export type JackIdContent = { jackId: JackId; label?: string };
export type PlugIdContent = { plugId: PlugId; label?: string };
export type JackJsObject = LabelContent | JackIdContent;
export type PlugJsObject = LabelContent | PlugIdContent;

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
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-around;
        background-color: ${BACKGROUND_COLOR};
        position: relative;
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
      const p2 = this.pagePointerToGaragePoint(e);
      Edge.moveTo(this._currentlyDrawing.edge, p1, p2);
    });

    this.addEventListener("pointerdown", () => {
      this.closeButton.hide();
      this.cancelDrawingEdge();
    });
  }

  addVertex(spec: Omit<VertonVertexJsObject, "_id">): void {
    const specFilled = Object.assign(
      {
        plugs: [],
        config: [],
        jacks: [],
        colors: {},
        position: this._searchPosition(),
        _id: this._generateNewId(),
      },
      spec
    );
    this._getVertexesContainer().append(VertonVertex.build(specFilled, this));
  }

  startDrawingEdge(
    from: GwPlugId,
    centerOfPlug: Point,
    clickedPoint: PagePointer
  ) {
    const edge = Edge.create(
      from,
      centerOfPlug,
      this.pagePointerToGaragePoint(clickedPoint),
      this
    );
    this._currentlyDrawing = { edge, from: centerOfPlug };
    this._getEdgesContainer().append(edge);
  }

  finishDrawingEdge(to: GwJackId, p2: Point) {
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

  findPlugWith({ vertexId, plugId }: GwPlugId): Plug.Type | undefined {
    const vertex = this._getVertexesContainer().querySelector(
      `[data-vertex-id="${vertexId}"]`
    ) as VertonVertex | null;
    return vertex?.findPlugOf(plugId!);
  }

  findJackWith({ vertexId, jackId }: GwJackId): Jack.Type | undefined {
    const vertex = this._getVertexesContainer().querySelector(
      `[data-vertex-id="${vertexId}"]`
    ) as VertonVertex | null;
    return vertex?.findJackOf(jackId!);
  }

  toJsObject(): VertonGarageJsObject {
    const vertexes: Required<VertonVertexJsObject>[] = [];
    const vertexElems = this._getVertexesContainer().getElementsByTagName(
      "verton-vertex"
    ) as HTMLCollectionOf<VertonVertex>;
    for (let i = 0; i < vertexElems.length; ++i) {
      vertexes.push(vertexElems[i].toJsObject());
    }

    const edges: Edge.JsObject[] = [];
    const edgeElems = this._getEdgesContainer().children;
    for (let i = 0; i < edgeElems.length; ++i) {
      edges.push(Edge.toJsObject(edgeElems[i] as Edge.Type));
    }
    return { vertexes, edges };
  }

  loadJsObject({ vertexes, edges }: VertonGarageJsObject) {
    let maxVertexId = this._lastVertexId;
    for (const vertex of vertexes) {
      this._getVertexesContainer().append(VertonVertex.build(vertex, this));
      if (vertex._id > maxVertexId) {
        maxVertexId = vertex._id;
      }
    }
    this._lastVertexId = maxVertexId;
    for (const { from, to } of edges) {
      const plug = this.findPlugWith(from)!;
      const centerOfPlug = JackOrPlug.centerOf(plug, this);
      const edgeElem = Edge.create(from, centerOfPlug, centerOfPlug, this);
      const jack = this.findJackWith(to)!;
      const centerOfJack = JackOrPlug.centerOf(jack, this);
      Edge.moveTo(edgeElem, centerOfPlug, centerOfJack);
      Edge.connectTo(edgeElem, to);
      this._getEdgesContainer().append(edgeElem);
    }
  }

  getBoundingGarageRect(elem: Element): Rect {
    const garageRect = this.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();
    const left = elemRect.left - garageRect.left;
    const top = elemRect.top - garageRect.top;
    return {
      width: elemRect.width,
      height: elemRect.height,
      left,
      right: left + elemRect.width,
      top,
      bottom: top + elemRect.height,
    };
  }

  pagePointerToGaragePoint({ pageX, pageY }: PagePointer): Point {
    const { left, top } = this.getBoundingClientRect();
    return {
      x: pageX - left,
      y: pageY - top,
    };
  }

  private _searchPosition(): Point {
    const points: Point[] = [];
    const vertexElems = this._getVertexesContainer().getElementsByTagName(
      "verton-vertex"
    ) as HTMLCollectionOf<VertonVertex>;
    for (let i = 0; i < vertexElems.length; ++i) {
      points.push(vertexElems[i].getPosition());
    }
    const { width: x, height: y } = this.getBoundingClientRect();
    const result = VertonGarage.findNonOverlappingPoint({ x, y }, points);
    if (result === undefined) {
      console.warn("Could not find a non-overlapping point");
      return { x: 0, y: 0 };
    }
    return result;
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

  static findNonOverlappingPoint(
    endPoint: Point,
    points: Point[]
  ): Point | undefined {
    const threshold = 80;

    let pO = { x: 0, y: 0 };
    let pE = endPoint;

    points.sort((pa, pb) => pa.x - pb.x);
    points.unshift(pO);
    points.push(pE);
    for (let i = 1; i < points.length; ++i) {
      const { x: xa, y } = points[i - 1];
      const xb = points[i].x;
      const diff = xb - xa;
      if (diff >= threshold) {
        const midX = xa + diff / 2;
        return { x: midX, y: y + threshold };
      }
    }

    points.sort((pa, pb) => pa.y - pb.y);
    for (let i = 1; i < points.length; ++i) {
      const { x, y: ya } = points[i - 1];
      const yb = points[i].y;
      const diff = yb - ya;
      if (diff >= threshold) {
        const midY = ya + diff / 2;
        return { x: x + threshold, y: midY };
      }
    }
  }
}

componentClasses["verton-garage"] = VertonGarage;

export namespace Edge {
  export type Type = SVGElement;
  export type JsObject = {
    from: GwPlugId;
    to: GwJackId;
  };

  export function create(
    { vertexId, plugId }: GwPlugId,
    centerOfPlug: Point,
    clickedPoint: Point,
    garage: VertonGarage
  ): Type {
    const { top, left, width, height, x1, y1, x2, y2 } = calcEdgeDef(
      centerOfPlug,
      clickedPoint
    );

    const edge = document.createElementNS(SVG_NS, "svg");
    edge.classList.add("edge");
    edge.style.left = `${left}px`;
    edge.style.top = `${top}px`;
    edge.setAttribute("width", `${width}px`);
    edge.setAttribute("height", `${height}px`);
    edge.dataset.fromVertexId = vertexId.toString();
    edge.dataset.fromPlugId = plugId.toString();

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
        const { left, width, top, height } = garage.getBoundingGarageRect(edge);
        garage.closeButton.show({
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

  export function connectTo(edge: Type, { vertexId, jackId }: GwJackId) {
    edge.dataset.toVertexId = vertexId.toString();
    edge.dataset.toJackId = jackId;
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

  export function getGwPlugId(edge: Type): GwPlugId {
    return {
      vertexId: Number(edge.dataset.fromVertexId)!,
      plugId: edge.dataset.fromPlugId!,
    };
  }

  export function getGwJackId(edge: Type): GwJackId {
    return {
      vertexId: Number(edge.dataset.toVertexId)!,
      jackId: edge.dataset.toJackId!,
    };
  }

  export function toJsObject(edge: Type): JsObject {
    const fromVertexId = Number(edge.dataset.fromVertexId);
    if (isNaN(fromVertexId)) {
      throw new Error(`Invalid fromVertexId: ${edge.dataset.fromVertexId}`);
    }
    const fromPlugId = edge.dataset.fromPlugId;
    if (!fromPlugId) {
      throw new Error(`Invalid fromPlugId: ${edge.dataset.fromPlugId}`);
    }

    const toVertexId = Number(edge.dataset.toVertexId);
    if (isNaN(toVertexId)) {
      throw new Error(`Invalid toVertexId: ${edge.dataset.toVertexId}`);
    }

    const toJackId = edge.dataset.toJackId;
    if (!toJackId) {
      throw new Error(`Invalid toJackId: ${edge.dataset.toJackId}`);
    }
    return {
      from: { vertexId: fromVertexId, plugId: fromPlugId },
      to: { vertexId: toVertexId, jackId: toJackId },
    };
  }
}

const CONFIG_ID_PREFIX = "config-";

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
    this._movingFrom = this._garage!.pagePointerToGaragePoint(e);
    this._garage!.raiseToTop(this);
    this.setPointerCapture(e.pointerId);
  }

  private _onPointerMove(e: PointerEvent) {
    e.preventDefault();
    if (!this._movingFrom) {
      return;
    }

    const { x: newX, y: newY } = this._garage!.pagePointerToGaragePoint(e);
    const dx = newX - this._movingFrom.x;
    const dy = newY - this._movingFrom.y;

    this._movingFrom.x = newX;
    this._movingFrom.y = newY;

    const rect = this._garage!.getBoundingGarageRect(this);
    const newLeft = rect.left + dx;
    const newTop = rect.top + dy;

    const {
      width: garageWidth,
      height: garageHeight,
    } = this._garage!.getBoundingClientRect();
    const newLeftClamped = Math.min(
      Math.max(newLeft, 0),
      garageWidth - rect.width
    );
    const newTopClamped = Math.min(
      Math.max(newTop, 0),
      garageHeight - rect.height
    );

    this._setX(newLeftClamped);
    this._setY(newTopClamped);

    this._moveEdgesWithPlugs();
    this._moveEdgesWithJacks();
  }

  private _onPointerUp(e: PointerEvent) {
    const { right: x, top: y } = this._garage!.getBoundingGarageRect(
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
    jso: Required<VertonVertexJsObject>,
    garage: VertonGarage
  ): VertonVertex {
    const {
      header,
      plugs,
      jacks,
      config,
      colors,
      position,
      _id: vertexId,
    } = jso;

    const obj = new this();
    obj._setX(position.x);
    obj._setY(position.y);

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

    obj._appendJacks(vertexId, jacks, jacksJackLabelsPlugLabels, garage);

    VertonVertex._appendConfigInputs(config, jacksJackLabelsPlugLabels);

    r.append(inner);

    obj._appendPlugs(vertexId, plugs, jacksJackLabelsPlugLabels, garage);

    obj.dataset.initialValues = JSON.stringify(jso);

    return obj;
  }

  getPosition(): Point {
    return {
      x: parseInt(this.style.left, 10),
      y: parseInt(this.style.top, 10),
    };
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

  private _setX(x: number) {
    this.style.left = `${x}px`;
  }

  private _setY(y: number) {
    this.style.top = `${y}px`;
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
    const v = this.shadowRoot!.getElementById(CONFIG_ID_PREFIX + key);
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
    jacks: JackJsObject[],
    container: HTMLDivElement,
    garage: VertonGarage
  ) {
    const jacksElem = document.createElement("div");
    jacksElem.id = "jacks";

    const labels = document.createElement("div");
    labels.id = "jack-labels";

    for (let i = 0; i < jacks.length; ++i) {
      const jack = jacks[i];
      const hasJackId = "jackId" in jack;
      if (hasJackId) {
        const jackId = VertonVertex.validateId((jack as JackIdContent).jackId);
        jacksElem.append(Jack.build({ vertexId, jackId }, garage));
      }

      const hasLabel = "label" in jack;
      if (hasLabel) {
        const labelElem = document.createElement("div");
        labelElem.className = "label";
        labelElem.innerText = jack.label!;
        labels.append(labelElem);
      }

      if (!hasJackId && !hasLabel) {
        console.error(`Unkown object in jacks:`, jack);
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
    plugs: PlugJsObject[],
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

    for (let i = 0; i < plugs.length; ++i) {
      const plug = plugs[i];
      const hasPlugId = "plugId" in plug;
      if (hasPlugId) {
        const plugId = VertonVertex.validateId((plug as PlugIdContent).plugId);
        plugsElem.append(Plug.build({ vertexId, plugId }, garage));
      }

      const hasLabel = "label" in plug;
      if (hasLabel) {
        const labelElem = document.createElement("div");
        labelElem.className = "label";
        labelElem.innerText = plug.label!;
        labels.append(labelElem);
      }

      if (!hasPlugId && !hasLabel) {
        console.error(`Unkown object in plugs:`, plug);
      }
    }

    container.append(labels);

    r.append(plugsOuter);
  }

  private _moveEdgesWithPlugs() {
    this._forEdgesWithPlugs((edge, plug) => {
      const centerOfPlug = JackOrPlug.centerOf(plug, this._garage!);
      const jack = this._garage!.findJackWith(Edge.getGwJackId(edge));
      if (!jack) {
        console.error(
          `Could not find a jack with ${edge.dataset.toVertexId} ${edge.dataset.toJackId}`
        );
        return;
      }
      const centerOfJack = JackOrPlug.centerOf(jack, this._garage!);
      Edge.moveTo(edge, centerOfPlug, centerOfJack);
    });
  }

  private _moveEdgesWithJacks() {
    this._forEdgesWithJacks((edge, jack) => {
      const centerOfJack = JackOrPlug.centerOf(jack, this._garage!);
      const plug = this._garage!.findPlugWith(Edge.getGwPlugId(edge));
      if (!plug) {
        console.error(
          `Could not find a plug with ${edge.dataset.toVertexId} ${edge.dataset.toPlugId}`
        );
        return;
      }
      const centerOfPlug = JackOrPlug.centerOf(plug, this._garage!);
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
    configContents: { [key: string]: number },
    container: HTMLElement
  ) {
    const div = document.createElement("div");
    div.id = "Config-container"; // Capitalize the id to avoid name conflicts.
    for (const [key, value] of Object.entries(configContents)) {
      const input = document.createElement("input");
      input.setAttribute("type", "number");
      input.setAttribute("value", value.toString());
      input.id = `config-${VertonVertex.validateId(key)}`;
      input.classList.add("config");

      // Prevent the parent vertex from taking focus by setPointerCapture
      input.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });

      div.appendChild(input);
    }
    container.appendChild(div);
  }

  static validateId(s: string): string {
    if (/^[-\w]+$/.test(s)) {
      return s;
    }
    throw new Error(`Invalid identifier: ${JSON.stringify(s)}`);
  }

  toJsObject(): Required<VertonVertexJsObject> {
    const jso = JSON.parse(this.dataset.initialValues!);

    const config: Config = {};
    const configElems = this.shadowRoot!.querySelectorAll(".config");
    for (let i = 0; i < configElems.length; ++i) {
      const configElem = configElems[i] as HTMLInputElement;
      const key = configElem.id.slice(CONFIG_ID_PREFIX.length);
      config[key] = Number(configElem.value);
    }

    const position = this.getPosition();

    return {
      ...jso,
      config,
      position,
    };
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

  export function centerOf(elem: HTMLElement, garage: VertonGarage): Point {
    const rect = garage.getBoundingGarageRect(elem);
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }
}

namespace Plug {
  export type Type = HTMLElement;

  export function build(id: GwPlugId, garage: VertonGarage): Type {
    const elem = JackOrPlug.build();
    elem.dataset.plugId = id.plugId.toString();

    elem.addEventListener("pointerdown", (e) => {
      if (garage.isDrawingEdge()) {
        return;
      }
      e.stopPropagation();
      const centerOfPlug = JackOrPlug.centerOf(elem, garage);
      garage.startDrawingEdge(id, centerOfPlug, e);
    });

    return elem;
  }
}

namespace Jack {
  export type Type = HTMLElement;

  export function build(id: GwJackId, garage: VertonGarage): Type {
    const elem = JackOrPlug.build();
    elem.dataset.jackId = id.jackId;

    elem.addEventListener("pointerup", (e) => {
      if (!garage.isDrawingEdge()) {
        return;
      }
      e.stopPropagation();
      garage.finishDrawingEdge(id, JackOrPlug.centerOf(elem, garage));
    });
    elem.addEventListener("pointerdown", (e) => {
      if (!garage.isDrawingEdge()) {
        return;
      }
      e.stopPropagation();
      garage.finishDrawingEdge(id, JackOrPlug.centerOf(elem, garage));
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

export function activateWebComponents() {
  for (const [elementName, componentClass] of Object.entries(
    componentClasses
  )) {
    customElements.define(elementName, componentClass);
  }
}
