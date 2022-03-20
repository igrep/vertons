import { VertonGarage, activateWebComponents } from "./lib";

activateWebComponents();

const garage = document.getElementsByTagName(
  "verton-garage"
)[0] as VertonGarage;

const stageElem = document.getElementById("stage")!;
const closeButtonElem = document.getElementById("closeButton")!;

function invalidArgument(argument?: string): never {
  throw new Error(`Invalid argument: ${argument}`);
}

const COLORS = {
  intermediate: { window: "#00D198" },
  object: { window: "#FF7A26" },
};

document
  .getElementsByClassName("js-menuBar")[0]!
  .addEventListener("click", (e) => {
    const menuItem = e.target as HTMLElement;
    if (!menuItem.dataset.handler) {
      return;
    }

    switch (menuItem.dataset.handler) {
      case "addClickInstruction":
        garage.addVertex({
          header: "クリック",
          plugs: [
            { label: "X座標", plugId: "x" },
            { label: "Y座標", plugId: "y" },
          ],
        });
        break;
      case "addConstInstruction":
        garage.addVertex({
          header: "定数",
          plugs: [{ label: "値", plugId: "value" }],
          config: { value: 0 },
        });
        break;
      case "addTimeInstruction":
        garage.addVertex({
          header: "経過時間",
          plugs: [{ label: "値", plugId: "value" }],
        });
        break;
      case "addArithmeticInstruction":
        const operator =
          menuItem.dataset.argument ||
          invalidArgument(menuItem.dataset.argument);
        garage.addVertex({
          header: "けいさん",
          jacks: [{ jackId: "left" }, { label: operator }, { jackId: "right" }],
          plugs: [{ label: "=" }, { plugId: "result" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addComparisonInstruction":
        const comparator =
          menuItem.dataset.argument ||
          invalidArgument(menuItem.dataset.argument);
        garage.addVertex({
          header: "くらべる",
          jacks: [
            { jackId: "left" },
            { label: comparator },
            { jackId: "right" },
          ],
          plugs: [{ label: "結果" }, { plugId: "result" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addCounterInstruction":
        garage.addVertex({
          header: "カウンター",
          jacks: [
            { jackId: "increment", label: "増やす" },
            { jackId: "decrement", label: "減らす" },
            { jackId: "reset", label: "リセット" },
          ],
          plugs: [{ label: "カウント" }, { plugId: "count" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addNotInstruction":
        garage.addVertex({
          header: "NOT",
          jacks: [{ jackId: "input", label: "入力" }],
          plugs: [{ plugId: "output", label: "出力" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addAndInstruction":
        garage.addVertex({
          header: "AND",
          jacks: [
            { jackId: "left", label: "入力1" },
            { jackId: "right", label: "入力1" },
          ],
          plugs: [{ plugId: "output", label: "出力" }],
          colors: COLORS.intermediate,
        });
        break;
      case "addObjectInstruction":
        const object =
          menuItem.dataset.argument ||
          invalidArgument(menuItem.dataset.argument);
        garage.addVertex({
          header: object,
          jacks: [
            { label: "X座標" },
            { jackId: "x" },
            { label: "Y座標" },
            { jackId: "y" },
          ],
          colors: COLORS.object,
        });
        break;
      case "play":
        break;
      case "save":
        // Ref. (In Japanese) https://qiita.com/kerupani129/items/99fd7a768538fcd33420
        const jsonUri = encodeURIComponent(JSON.stringify(garage.toJsObject()));
        const a = document.createElement("a");
        a.href = `data:application/json;charset=utf-8,${jsonUri}`;
        a.download = "vertons.json";
        a.style.display = "none";
        console.log("SAVE");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        break;
      case "load":
        // Ref. (In Japanese) https://qiita.com/kerupani129/items/99fd7a768538fcd33420
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json,application/json";
        fileInput.onchange = () => {
          const reader = new FileReader();
          reader.readAsText(fileInput.files![0]);
          reader.onload = () => {
            garage.loadJsObject(JSON.parse(reader.result as string));
          };
        };
        fileInput.click();
        break;
      default:
        throw new Error(`Unknown handler: ${menuItem.dataset.handler}`);
    }
  });
