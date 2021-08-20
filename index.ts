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
});

garage.addVertex({
  header: "足し算",
  jackContents: [{ jackName: "left" }, { label: "+" }, { jackName: "right" }],
  plugContents: [{ label: "=" }, { plugName: "result" }],
  colors: { window: "#00D097" },
});

garage.addVertex({
  header: "🐶",
  jackContents: [
    { label: "X座標" },
    { jackName: "x" },
    { label: "Y座標" },
    { jackName: "y" },
  ],
  colors: { window: "#E37F4B" },
});
