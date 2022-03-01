import { VertonGarage, activateWebComponents } from "./lib";

activateWebComponents();

const garage = document.getElementsByTagName(
  "verton-garage"
)[0] as VertonGarage;

/*
garage.addVertex({
  header: "クリック",
  plugs: [
    { label: "X座標", plugId: "x" },
    { label: "Y座標", plugId: "y" },
  ],
  position: { x: 20, y: 20 },
});

garage.addVertex({
  header: "足し算",
  jacks: [{ jackId: "left" }, { label: "+" }, { jackId: "right" }],
  plugs: [{ label: "=" }, { plugId: "result" }],
  colors: { window: "#00D198" },
  position: { x: 60, y: 60 },
});

garage.addVertex({
  header: "🐶",
  jacks: [
    { label: "X座標" },
    { jackId: "x" },
    { label: "Y座標" },
    { jackId: "y" },
  ],
  colors: { window: "#FF7A26" },
  position: { x: 100, y: 100 },
});

garage.addVertex({
  header: "定数",
  plugs: [{ label: "値", plugId: "value" }],
  config: { value: 0 },
  position: { x: 140, y: 140 },
});
*/
garage.loadJsObject({
  vertexes: [
    {
      plugs: [
        { label: "X座標", plugId: "x" },
        { label: "Y座標", plugId: "y" },
      ],
      config: {},
      jacks: [],
      colors: {},
      _id: 0,
      header: "クリック",
      position: { x: 20, y: 20 },
    },
    {
      plugs: [],
      config: {},
      jacks: [
        { label: "X座標" },
        { jackId: "x" },
        { label: "Y座標" },
        { jackId: "y" },
      ],
      colors: { window: "#FF7A26" },
      _id: 2,
      header: "🐶",
      position: { x: 718, y: 88 },
    },
    {
      plugs: [{ label: "値", plugId: "value" }],
      config: { value: 0 },
      jacks: [],
      colors: {},
      _id: 3,
      header: "定数",
      position: { x: 36, y: 416 },
    },
    {
      plugs: [{ label: "=" }, { plugId: "result" }],
      config: {},
      jacks: [{ jackId: "left" }, { label: "+" }, { jackId: "right" }],
      colors: { window: "#00D198" },
      _id: 1,
      header: "足し算",
      position: { x: 356, y: 95 },
    },
  ],
  edges: [
    {
      from: { vertexId: 3, plugId: "value" },
      to: { vertexId: 2, jackId: "x" },
    },
    {
      from: { vertexId: 1, plugId: "result" },
      to: { vertexId: 2, jackId: "y" },
    },
    { from: { vertexId: 0, plugId: "x" }, to: { vertexId: 1, jackId: "left" } },
    {
      from: { vertexId: 0, plugId: "y" },
      to: { vertexId: 1, jackId: "right" },
    },
  ],
});
