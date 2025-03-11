import { defaultMoves, hexTokenTypes } from "../../constants/moveCosts.js";
import { moduleBasePath } from "../../constants/paths.js";

const hexTokenTypeChoices = {
  [hexTokenTypes.party]: "Scouting/Foraging Party",
  [hexTokenTypes.camp]: "Main Camp",
  [hexTokenTypes.none]: "None",
};

const localPath = (file) => `${moduleBasePath}sheets/hexCrawlConfig/${file}`;

export class HexCrawlConfig extends ActorSheet {
  /**
   * Define default rendering options for the NPC sheet
   * @return {Object}
   * @override
   */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["D35E", "sheet", "actor", "npc", "object"],
      width: 725,
      height: 400,
    });
  }

  /** 
  * @override
  */
  getData(options) {
    const sheetData = super.getData();
    const {
      isCamp = false,
      isParty = false
    } = this.object.prototypeToken.flags.hexCrawl || {};
    const currentPartyType = isCamp
      ? hexTokenTypes.camp
      : isParty
        ? hexTokenTypes.party
        : hexTokenTypes.none;
    return {
      ...sheetData,
      currentPartyType,
      hexTokenTypeChoices,
      shouldResetConfig: true,
    };
  };

  // setAsScoutParty = async (isFlaggedAsParty) => {
  //   await this.update({
  //     ['prototypeToken.flags.hexCrawl']: {
  //       isParty: !isFlaggedAsParty,
  //       isCamp: false,
  //     }
  //   });
  //   this.refresh({render: false});
  // }

  /** 
  * @override
  */
  async _updateObject(event, formData) {
    await super._updateObject(event, formData);
    const newSetting = formData.hexTokenType;
    const isCamp = newSetting === hexTokenTypes.camp;
    const isParty = newSetting === hexTokenTypes.party;
    const movesDetails = isCamp
      ? defaultMoves[hexTokenTypes.camp]
      : defaultMoves[hexTokenTypes.party];

    const configOptions = formData.shouldResetConfig
      ? {
        ['prototypeToken.texture.scaleX']: 0.6,
        ['prototypeToken.texture.scaleY']: 0.6,
        ['prototypeToken.bar1.attribute']: null,
        dimSight: 1,
        brightSight: 2.5,
      } : {};

    await this.object.update({
      // img is just used by the v11 3.5
      img: this.object.prototypeToken.texture.src,
      ['prototypeToken.flags.hexCrawl']: {
        isParty,
        isCamp,
        movesDetails,
        movesPerDay: movesDetails.normal.dailyMoves,
        currentMoveCount: movesDetails.normal.dailyMoves,
      },
      ...configOptions,
    });
    //this.refresh({render: false});
  }

  /**
   * Get the correct HTML template path to use for rendering this particular sheet
   * @type {String}
   * @override
   */
  get template() {
    return localPath("hexCrawlConfig.hbs");
  }
}