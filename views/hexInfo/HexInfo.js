import { localeInfoLookup } from "../../constants/moveCosts.js";
import { moduleBasePath } from "../../constants/paths.js";
import { getMoveCostFromLocale } from "../../repos/moves.js";
import { getHexCrawlDataFromTile, nullTileId } from "../../repos/tiles.js";
import { launchForagingYieldDetails } from "../foraging/ForagingYieldDetails.js";

const localPath = (file) => `${moduleBasePath}views/hexInfo/${file}`;

export class HexInfo extends FormApplication {
  #activeToken = null;
  constructor(tile, token, options) {
    super(tile, options);
    if (!!token) {
      this.#activeToken = token;
    }
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
    const tileData = await getHexCrawlDataFromTile(this.object);
    const cost = getMoveCostFromLocale(tileData.locale);
    const localeString = tileData.locale
      ?.map(l => localeInfoLookup[l].display)
      ?.join(', ');

    const events = Object.keys(tileData.events).reduce((results, nextKey) => {
      const next = tileData.events[nextKey];
      if (next.name !== nullTileId) {
        results.push(next);
      }
      return results;
    }, []);
    
    const hasEvents = events.some(x => x) ?? false;

    return {
      ...tileData,
      events,
      cost,
      hasEvents,
      localeString,
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
    //launchForagingYieldDetails(this.object, this.object.#activeToken);
  }
}

export const renderHexMoveInfo = (tile, { x, y }) => {
  const options = {
    template: localPath("hexMoveInfo.hbs"),
    isAttachedToMouse: true,
    x,
    y,
  };
  const infoWindow = new HexInfo(tile, options);
  infoWindow.render(true, {
  });

  return infoWindow;
};

export const renderHexDetailInfo = async (tile, token) => {
  const options = {
    template: localPath("hexActionInfo.hbs"),
  };
  const infoWindow = new HexInfo(tile, token, options);
  infoWindow.render(true);
};
