import { moduleCodePath } from "../../constants/paths.js";
import { initFactions, resetFactionData } from "../../factions/factions.js";
import { initGameClock, resetGameClock } from "../../repos/gameClock.js";
import { completeHexCrawlInit, getCampToken, getHexCrawlTokens, hasCompletedHexCrawlInit, initGroupConfig } from "../../repos/gameSettings.js";
import { defaultProvisions, getStartingProvisions, resetAllProvisions, updateProvisions } from "../../repos/provisions.js";
import { resetEventsForAllTiles } from "../../repos/tiles.js";

const localPath = (file) => `${moduleCodePath}views/hexInitForm/${file}`;

export class HexInitForm extends FormApplication {
  /** 
  * @override
  */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id:"cs-hex-init-form",
      title: "Initialize DL3 Hex Crawl",
      template: localPath("hexInitForm.hbs"),
      classes: [],
      width: 'auto',
      height: 'auto',
      closeOnSubmit: false,
      submitOnClose: false,
      resizable: true,
    });
  }

  /** 
  * @override
  */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".reset-btn").click(this._resetInitData.bind(this));
  }

  _resetInitData(event) {
    event?.preventDefault();
    const tokens = getHexCrawlTokens(this.object);
    resetAllProvisions(tokens);
    resetFactionData(this.object);
    initGroupConfig(this.object, {});
    resetGameClock(tokens);
    resetEventsForAllTiles(this.object);
    this.render();
  }

  /** 
  * @override
  */
  getData(options) {
    const provisions = {
      ...defaultProvisions,
    };
    return {
      ...provisions,
      foodPerCart: 0,
      startTime: 18,
      isInitComplete: hasCompletedHexCrawlInit(this.object),
    };
  };

  /** 
  * @override
  * Object is the scene
  */
  async _updateObject(event, formData) {
    const mainCampToken = getCampToken(this.object);
    if (!mainCampToken) {
      ui.notifications.error("Main camp token not found.");
      return;
    }
    

    if (hasCompletedHexCrawlInit(this.object)) {
      const isConfirmed = await Dialog.confirm({
        title: "Confirm Reset",
        content: "<p>Are you sure you want to reset the data? This action cannot be undone.</p>",
        defaultYes: false
      });

      if (!isConfirmed) {
        return;
      }
    }

    await this.initData(formData, mainCampToken);
    this.close();
  }

  async initData(formData, mainCampToken) {
    const allTokens = getHexCrawlTokens(this.object);
    await resetAllProvisions(allTokens);
    const populationData = await initFactions(this.object);
    formData.warriorCount = populationData.warriors;
    await Promise.all([
      initGameClock(allTokens, formData.startTime),
      updateProvisions(mainCampToken, getStartingProvisions(formData)),
      initGroupConfig(this.object, {}), // empty obj will reset all tokens
      completeHexCrawlInit(this.object),
      resetEventsForAllTiles(this.object),
    ]);
  }
};

export const launchHexInitForm = (scene) => {
  const initForm = new HexInitForm(scene);
  initForm.render(true);
};