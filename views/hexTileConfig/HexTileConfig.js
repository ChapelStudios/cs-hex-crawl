import { localeTypes } from "../../constants/moveCosts.js";
import { getTileLocale, getTileZoneId, updateTileHexCrawlData } from "../../repos/tiles.js";

const localPath = (file) => `${moduleBasePath}views/hexTileConfig/${file}`;

export class HexTileConfig extends FormApplication {
  #selectedTiles = [];

  constructor(scene, selectedTiles) {
    super(scene);
    this.#selectedTiles = selectedTiles;
  }

  /** 
  * @override
  */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id:"cs-hex-tile-config-form",
      title: "Configure DL3 Hex Crawl Tile",
      template: localPath("hexTileConfig.hbs"),
      classes: [],
      width: 'auto',
      height: 'auto',
      closeOnSubmit: true,
      submitOnClose: true,
      resizable: true,
    });
  }

  /** 
  * @override
  */
  getData(options) {
    const firstTile = this.#selectedTiles.find(x => x)?.document;
    const zoneId = getTileZoneId(firstTile);
    const selectedLocales = getTileLocale(firstTile);

    return {
      zoneId,
      tileTypes: Object.keys(localeTypes),
      selectedLocales,
    };
  };

  /** 
  * @override
  * Beware, this.object is the scene!
  */
  async _updateObject(event, formData) {
    const updateData = {
      zoneId: formData.zoneId,
      locale: [],
    };
    for (const localeType in localeTypes) {
      if (formData[localeType]) {
        updateData.locale.push(localeType);
      }
    }
    const jobs = [];
    for (const tile of this.#selectedTiles) {
      jobs.push(updateTileHexCrawlData(tile.document, updateData, true));
    }
    await Promise.all(jobs);
  }
}

export const launchHexTileConfig = (scene) => {
  const selectedTiles = canvas.tiles.controlled;

  if (!selectedTiles.length) {
    ui.notifications.warn("No tile selected");
    return;
  }

  const initForm = new HexTileConfig(scene, selectedTiles);
  initForm.render(true);
};