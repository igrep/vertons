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
