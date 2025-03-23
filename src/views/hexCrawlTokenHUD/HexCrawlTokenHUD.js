import { getCurrentMoveCountControl } from "./controls/CurrentMoveCountControl.js";
import { getCurrentTileActionsControl } from "./controls/CurrentTileActionsControl.js";
import { getCurrentTimeControl } from "./controls/CurrentTimeControl.js";
import { getOpenCampActionsControl } from "./controls/OpenCampActionsControl.js";
import { getOpenInventoryControl } from "./controls/OpenInventoryControl.js";
import { getRoadBonusIndicator } from "./controls/RoadBonusIndicator.js";

// const filterControls = (controls) => controls?.filter(c => c.section !== "left" && c.section !== "right") || [];

const getHexControls = (hud) => ({
  currentMovesField: getCurrentMoveCountControl(hud.object.document),
  inventoryBtn: getOpenInventoryControl(hud.object.document),
  tileActionsBtn: getCurrentTileActionsControl(hud.object.document, hud.object.owner),
  currentTimeField: getCurrentTimeControl(hud.object.document),
  roadBonusIndicator: getRoadBonusIndicator(hud.object.document),
  campActionsBtn: getOpenCampActionsControl(hud.object.document),
});

// export const buildGetData = (hud, defaultData) => (options) => {
//   const filteredControls = filterControls(defaultData);
//   filteredControls.push(...getHexControls(hud));
// };

// export const getHexCrawlTokenHudData = (controls, hub) => {
//   const superData = superGetData.bind(this)(options);
//   debugger;
//   superData.controls = filterControls(superData.controls);

//   superData.controls.push(...getHexControls(this));

//   return superData;
// }

// export class HexCrawlTokenHUD extends TokenHUD {
//   /** 
//   * @override
//   */
//   async getData(options) {
//     const superData = await super.getData(options)
//     if (isHexCrawlToken(this.object)) {
//       debugger;
//       superData.controls = filterControls(superData.controls);
    
//       superData.controls.push(...getHexControls(this));
//     }
  
//     return superData;
//   }
// }

export const applyHexCrawlHudToHtml = (hud, html) => {
  const {
    currentMovesField,
    inventoryBtn,
    tileActionsBtn,
    currentTimeField,
    roadBonusIndicator,
    campActionsBtn,
  } = getHexControls(hud);
  const movesElement = `<input type="text" name="moves" value="${currentMovesField.value}" ${game.user.isGM ? "" : "disabled"}>`;
  const timeElement = `<input type="text" name="moves" value="${currentTimeField.value}" ${game.user.isGM ? "" : "disabled"}>`;

  html.find('.left .elevation')?.[0].remove();
  html.find('.left [data-action="target"]')?.[0].remove();
  const leftCol =  $('.col.left', html);

  leftCol
    .prepend(
      $('<div>').addClass("cs-hc-phc control-icon") //playerHudControl
        .append(`<i class="${roadBonusIndicator.icon} ${roadBonusIndicator.class}"></i>`))
    .prepend(
      $('<div>').addClass("cs-hc-phc attribute") //playerHudControl
        .append(timeElement)
        .change(currentTimeField.onchange)
    );

  if (campActionsBtn.visible) {
    leftCol.append(
      $('<div>').addClass("cs-hc-phc control-icon") //playerHudControl
        .append(`<i class="${campActionsBtn.icon} ${campActionsBtn.class}"></i>`)
        .click(campActionsBtn.onclick)
    );
  }

  const rightCol = $('.col.right', html);
  rightCol.html(
    $('<div>').addClass("cs-hc-phc attribute elevation") //playerHudControl
      .append(movesElement)
      .change(currentMovesField.onchange)
  )
    .append(
      $('<div>').addClass("cs-hc-phc control-icon") //playerHudControl
        .append(`<i class="${inventoryBtn.icon} ${inventoryBtn.class}"></i>`)
        .click(inventoryBtn.onclick)
    );

  if (tileActionsBtn.visible) {
    rightCol.append(
      $('<div>').addClass("cs-hc-phc control-icon") //playerHudControl
        .append(`<i class="${tileActionsBtn.icon} ${tileActionsBtn.class}"></i>`)
        .click(tileActionsBtn.onclick)
    );
  }
  
  return html;
}