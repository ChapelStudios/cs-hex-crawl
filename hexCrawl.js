import {
  flipMoveHoverState,
  hasCompletedHexCrawlInit,
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
import { convertToHoursAndMinutes } from "./helpers/math.js";

// Register public functions
// Hooks.once("init", async function () {

//   // Needs 12
//   //CONFIG.Token.hudClass = HexCrawlTokenHUD;
  
//   game.hexCrawl = {
//     ...(game.hexCrawl ?? {}),
//     api: {      
//       // put classes here
//     }
//   };
// });

// const addActiveClass = (lookupString) => {
//   $(lookupString).toggleClass('active');
// };

dl3HexCrawlSocketInit();

const showMoveInfoControlName = "cs-hex-show-move-info";

// Register Hex Crawl Control buttons
Hooks.on("getSceneControlButtons", (controls) => {;
  const currentScene = canvas.scene;
  controls.find((control) => control.name === "token")
    .tools.push({
      name: showMoveInfoControlName,
      title: "Show Hexcrawl Move Info",
      icon: "fa-solid fa-hexagon-image",
      toggle: true,
      active: false,
      onClick: async (toggleState) => {
        await flipMoveHoverState(currentScene);
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
    });
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

  // HexMoveInfo
  await setMoveHoverState(false);
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
    return;
  }

  const mousePos = event.data.getLocalPosition(canvas.app.stage);

  const gridPos = canvas.grid.getSnappedPosition(mousePos.x, mousePos.y);

  const tile = await dl3HexCrawlSocket.executeAsGM('getTileByLocation', canvas.scene, gridPos);

  if (!!mouseApp && currentMouseAppTileId !== (tile?._id ?? null)) {
    closeMouseApp();
  }

  if (!!tile) {
    currentMouseAppTileId = tile._id;
    mouseApp = renderHexMoveInfo(tile, mousePos);
  }
}

Hooks.on('canvasReady', () => {
  canvas.stage.on('mousemove', handleMouseMove);
});

Handlebars.registerHelper('contains', (array, value) => array && array.includes(value));
Handlebars.registerHelper('formatTime', convertToHoursAndMinutes);

Hooks.on('createToken', async (tokenDoc, options, userId) => {
  if (isHexCrawlToken(tokenDoc)) {
    await tokenDoc.update({
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
Hooks.on('preUpdateToken', async (token, updates, options, userId) => {
  await onTokenMove(canvas.scene, token, updates, options, userId);
});