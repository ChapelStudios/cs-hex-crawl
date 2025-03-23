import {
  confirmTokenDelete,
  flipMoveHoverState,
  isHexCrawlToken,
  isMoveHoverStateActive,
  setMoveHoverState
} from "./repos/gameSettings.js";
import { HexCrawlConfig } from "./sheets/hexCrawlConfig/HexCrawlConfig.js";
import { dl3HexCrawlSocket, dl3HexCrawlSocketInit } from "./socket.js";
import { renderHexMoveInfo } from "./views/hexInfo/HexInfo.js";
import { launchHexTileConfig } from "./views/hexTileConfig/HexTileConfig.js";
import { launchHexInitForm } from "./views/hexInitForm/HexInitForm.js";
import { launchPartyManager } from "./views/partyManager/PartyManager.js";
import { onTokenMove } from "./repos/moves.js";
import { applyHexCrawlHudToHtml } from "./views/hexCrawlTokenHUD/HexCrawlTokenHUD.js";
import { launchFactionManager } from "./views/factionManager/FactionManager.js";
import { convertToHoursAndMinutes, isWithinRange } from "./helpers/math.js";
import { getTileByLocationActionName, resetEventsForAllTiles } from "./repos/tiles.js";
import { launchAttritionManager } from "./views/attritionManager/AttritionManager.js";
import { launchCampActionsGmScreen } from "./views/campActionsGmScreen/CampActionsGmScreen.js";
import { updateToken } from "./helpers/update.js";
import { cachePixelData, checkVisibility, checkVisibilityForTokens, getFogCanvas, isAreaExplored } from "./helpers/fog.js";
import { snapToAlternatingHexGrid } from "./helpers/display.js";

// Register public API
Hooks.once("init", async function () {

  // Needs 12
  //CONFIG.Token.hudClass = HexCrawlTokenHUD;
  
  game.hexCrawl = {
    ...(game.hexCrawl ?? {}),
    api: {      
      // put classes here
      resetEventsForAllTiles: () => resetEventsForAllTiles(canvas.scene),
    }
  };
});

// const addActiveClass = (lookupString) => {
//   $(lookupString).toggleClass('active');
// };

dl3HexCrawlSocketInit();

const showMoveInfoControlName = "cs-hex-show-move-info";

// Register Hex Crawl Control buttons
Hooks.on("getSceneControlButtons", (controls) => {
  // HexMoveInfo
  setMoveHoverState(false);

  const currentScene = canvas.scene;
  controls.find((control) => control.name === "token")
    .tools.push({
      name: showMoveInfoControlName,
      title: "Show Hexcrawl Move Info",
      icon: "fa-solid fa-hexagon-image",
      toggle: true,
      active: isMoveHoverStateActive(),
      onClick: async () => {
        if (!isMoveHoverStateActive()) {
          // await cachePixelData();
        }
        await flipMoveHoverState(currentScene);
        // game.hexCrawl.fogMap = await getFogCanvas();
      },
    });

  // GM only tools
  if (!game.user.isGM) return;
  game.D35E.logger.log("Init button added");
  controls.find((control) => control.name === "tiles")
    .tools.push({
      name: "cs-hex-tile-config",
      title: "Hexcrawl Tile Config",
      icon: "fa-solid fa-hexagon-image",
      button: true,
      onClick: async () => {
        launchHexTileConfig(currentScene);
      },
    });
  controls.find((control) => control.name === "d35e-gm-tools")
    .tools.push({
      name: "cs-hex-scene-init",
      title: "Initialize HexCrawl",
      icon: "fa-solid fa-hexagon-exclamation flipped",
      button: true,
      onClick: async () => {
        launchHexInitForm(currentScene);
      },
    }, {
      name: "cs-hex-party-manager",
      title: "Hexcrawl Party Manager",
      icon: "fa-duotone fa-solid fa-people-group",
      button: true,
      onClick: async () => {
        launchPartyManager(currentScene);
      },
    }, {
      name: "cs-hex-factions-manager",
      title: "Hexcrawl Factions Manager",
      icon: "fa-solid fa-user-group-crown",
      button: true,
      onClick: async () => {
        launchFactionManager(currentScene);
      },
    }, {
      name: "cs-hex-attrition-manager",
      title: "Hexcrawl Attrition Manager",
      icon: "fa-duotone fa-solid fa-chart-line-down",
      button: true,
      onClick: async () => {
        launchAttritionManager(currentScene);
      },
    }, {
      name: "cs-hex-gm-camp-actions",
      title: "Hexcrawl Camp Actions GM Screen",
      icon: "fa-solid fa-campfire",
      button: true,
      onClick: async () => {
        launchCampActionsGmScreen(currentScene);
      },
    }
  );
});

// Party Inv
Hooks.on("renderTokenHUD", (hud, html, token) => {
  if (isHexCrawlToken(token)) {
    html = applyHexCrawlHudToHtml(hud, html);
  }
});

Hooks.once("ready", async function () {

  Actors.registerSheet("D35E", HexCrawlConfig, {
    types: ["character"],
    makeDefault: false,
    label: "Hex Crawl Party Sheet",
  });
});

let mouseApp;
let currentMouseAppTileId;

const closeMouseApp = () => {
  mouseApp?.close();
  mouseApp = null;
  currentMouseAppTileId = null;
}

const handleMouseMove = async (event) => {
  // if dl3HexCrawlSocket isn't ready, the scene hasn't fully loaded yet;
  if (!isMoveHoverStateActive() || !dl3HexCrawlSocket) {
    closeMouseApp();
    return;
  }

  const mousePos = event.data.getLocalPosition(canvas.app.stage);

  const gridPos = snapToAlternatingHexGrid(mousePos.x, mousePos.y);

  const tile = await dl3HexCrawlSocket.executeAsGM(getTileByLocationActionName, canvas.scene, gridPos);

  if (!tile || !checkVisibilityForTokens(gridPos, { })) {
  // if (!tile || !isWithinRange(gridPos)) {
    closeMouseApp();
    return;
  }

  if (mouseApp) {
    // Check if it's a different tile.
    if (currentMouseAppTileId !== tile._id) {
      // Update the underlying tiledata and force a refresh.
      mouseApp.object = tile;
      currentMouseAppTileId = tile._id;
      mouseApp.gridPos = gridPos;
    }
    // Always update the position so it follows the mouse.
    // mouseApp.updatePosition(mousePos);
    await mouseApp.render(true); // Force re-render with updated tile data.
    return;
  } else {
    currentMouseAppTileId = tile._id;
    mouseApp = await renderHexMoveInfo(tile, mousePos, gridPos);
  }

}

Hooks.on('canvasReady', () => {
  canvas.stage.on('mousemove', handleMouseMove);
});

Handlebars.registerHelper('contains', (array, value) => array && array.includes(value));
Handlebars.registerHelper('formatTime', convertToHoursAndMinutes);
Handlebars.registerHelper('range', function (start, end) {
  const range = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
});
Handlebars.registerHelper('eq', (a, b) => a === b);



Hooks.on('createToken', async (tokenDoc, options, userId) => {
  if (isHexCrawlToken(tokenDoc)) {
    await updateToken(tokenDoc, {
      scale: 0.6,
      displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
      bar1: { attribute: null },
      bar2: { attribute: null }
    });
  }
});
// Hooks.on('updateToken', async (token, updates, options, userId) => {
//   await onTokenMove(token, updates, options, userId);
// });
let tokenUpdateInProgress = false;

Hooks.on('preUpdateToken', async (token, updates, options, userId) => {
  if (tokenUpdateInProgress) return; // Skip if this is an internal update
  tokenUpdateInProgress = true;
  try {
    await onTokenMove(canvas.scene, token, updates, options, userId);
  } finally {
    tokenUpdateInProgress = false;
  }
});

Hooks.on("preDeleteToken", async (tokenData, options, userId) => isHexCrawlToken(tokenData)
  ? await confirmTokenDelete(tokenData)
  : true
);
