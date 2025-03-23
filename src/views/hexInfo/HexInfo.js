import { nullTileId } from "../../constants/events/constants.js";
import { localeInfoLookup } from "../../constants/moveCosts.js";
import { moduleCodePath } from "../../constants/paths.js";
import { discoverTileActionName } from "../../repos/events.js";
import { getTokenByUser } from "../../repos/gameSettings.js";
import { getMoveCost } from "../../repos/moves.js";
import { getHexCrawlDataFromTile } from "../../repos/tiles.js";
import { dl3HexCrawlSocket } from "../../socket.js";
import { launchForagingYieldDetails } from "../foraging/ForagingYieldDetails.js";

const localPath = (file) => `${moduleCodePath}views/hexInfo/${file}`;

export class HexInfo extends FormApplication {
  #activeToken = null;
  isActions = false;
  gridPos;

  constructor(tile, token, options) {
    super(tile, options);
    if (!!token) {
      this.#activeToken = token;
    }
    this.isActions = options.isActions ?? false;
    this.gridPos = options.gridPos;
  }

  /** 
  * @override
  * object is Tile
  */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id:"cs-hex-info",
      title: "Hex Event Details",
      classes: [],
      width: 'auto',
      height: 'auto',
      resizable: true,
      isAttachedToMouse: false,
    });
  }

  /** 
  * @override
  */
  async getData(options) {
    const tileData = getHexCrawlDataFromTile(this.object);
    const costInfo = getMoveCost(this.object, this.#activeToken);
    const localeString = tileData.locale
      ?.map(l => localeInfoLookup[l]?.display)
      ?.join(', ');

    const events = Object.keys(tileData.events).reduce((results, nextKey) => {
      const next = tileData.events[nextKey];
      if (next.name !== nullTileId) {
        results.push(next);
      }
      return results;
    }, []);

    const hasEvents = events.some(x => x) ?? false;

    const eventCost = events.reduce((total, e)=> e.isComplete ? e.cost + total : total, 0);

    return {
      ...tileData,
      ...costInfo,
      events,
      hasEvents,
      localeString,
      spent: costInfo.cost + eventCost,
      isGm: game.user.isGM,
      tokenName: this.#activeToken?.name ?? "",
      gridPos: this.gridPos,
    };
  }
  
  //** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Dynamically add CSS file
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = localPath("hexInfo.css");
    document.head.appendChild(link);

    if (this.#activeToken) {
      html.find('.cs-hex-foraging').on('click', this._handlePartyPickup.bind(this));
    }
  }

  /** 
  * @override
  */
  async _render(force, options) {
    await super._render(force, options);
    
    if (this.options.isAttachedToMouse) {
      // Get the mouse position
      const htmlPos = canvas.app.renderer.plugins.interaction.pointer.screen;

      // Adjust the position of the form to be just to the right of the mouse cursor
      this.element.css({
        top: htmlPos.y + 'px',
        left: (htmlPos.x + 14) + 'px', // Add a small offset to the right of the cursor
      });
    }
  }

  async _handlePartyPickup() {
    launchForagingYieldDetails(this.object, this.#activeToken, () => this.render());
  }
};

export const renderHexMoveInfo = async (tile, { x, y }, gridPos) => {
  let token = getTokenByUser(canvas.scene);
  if (token.document) {
    // this shouldn't happen!
    token = token.document
  }
  const options = {
    template: localPath("hexMoveInfo.hbs"),
    isAttachedToMouse: true,
    x,
    y,
    gridPos,
  };

  // Close existing HexInfo instances
  const closingPromises = Object.values(ui.windows)
    .filter(app => app instanceof HexInfo && !app.isActions)
    .map(app => app.close());

  // Wait for all HexInfo instances to close
  await Promise.all(closingPromises);

  // Create and render new HexInfo instance
  const infoWindow = new HexInfo(tile, token, options);
  await infoWindow.render(true);

  return infoWindow;
};

export const renderHexDetailInfo = async (tile, token) => {
  await dl3HexCrawlSocket.executeAsGM(discoverTileActionName, canvas.scene, tile, token);
  tile = canvas.scene.tiles.get(tile._id);

  const options = {
    template: localPath("hexActionInfo.hbs"),
    height: '290px',
    isActions: true,
  };
  const infoWindow = new HexInfo(tile, token, options);
  infoWindow.render(true);
};
