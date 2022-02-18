import { VertonGarage, activateWebComponents } from "./lib";

activateWebComponents();

const garage = document.getElementsByTagName(
  "verton-garage"
)[0] as VertonGarage;

garage.addVertex({
  header: "クリック",
  plugContents: [
    { label: "X座標", plugName: "x" },
    { label: "Y座標", plugName: "y" },
  ],
  position: { x: 20, y: 20 },
});

garage.addVertex({
  header: "足し算",
  jackContents: [{ jackName: "left" }, { label: "+" }, { jackName: "right" }],
  plugContents: [{ label: "=" }, { plugName: "result" }],
  colors: { window: "#00D198" },
  position: { x: 60, y: 60 },
});

garage.addVertex({
  header: "🐶",
  jackContents: [
    { label: "X座標" },
    { jackName: "x" },
    { label: "Y座標" },
    { jackName: "y" },
  ],
  colors: { window: "#FF7A26" },
  position: { x: 100, y: 100 },
});

garage.addVertex({
  header: "定数",
  plugContents: [{ label: "値", plugName: "value" }],
  configContents: ["value"],
  position: { x: 140, y: 140 },
});
