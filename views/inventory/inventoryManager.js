import { moduleBasePath } from "../../constants/paths.js";
import { convertHoursToDaysAndHours } from "../../helpers/math.js";
import { getGameClock } from "../../repos/gameClock.js";
import { getCampConfig, getPartyConfig, isPartyToken } from "../../repos/gameSettings.js";
import { getProvisions } from "../../repos/provisions.js";

const localPath = (file) => `${moduleBasePath}views/inventory/${file}`;

// Register partials
Handlebars.registerPartial('provisionFields', await fetch(localPath('partials/provisionFields.hbs')).then(response => response.text()));
Handlebars.registerPartial('partyGroupInfoFields', await fetch(localPath('partials/partyGroupInfoFields.hbs')).then(response => response.text()));
Handlebars.registerPartial('campGroupInfoFields', await fetch(localPath('partials/campGroupInfoFields.hbs')).then(response => response.text()));
Handlebars.registerPartial('timeDataFields', await fetch(localPath('partials/timeDataFields.hbs')).then(response => response.text()));

export class InventoryManager extends FormApplication {
  /**
  *  @override
  **/
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id:"cs-hex-inv",
      classes: [],
      width: 400,
      height: 'auto',
      resizable: true,
    });
  }

  // Generate unique ID for each form instance based on token ID
  get id() {
    return `cs-hex-inv-${this.object.id}`;
  }

  /**
  *  @override
  **/
  getData(options) {
    const provisions = getProvisions(this.object);
    const {
      partyMembers,
      ...refugeeInfo
    } = this.options.getConfig(this.object);

    const gameClock = getGameClock(this.object);

    const partyMemberString = partyMembers.map(id => game.actors.get(id).name)
      .join(', ');

    return {
      ...provisions,
      ...refugeeInfo,
      ...gameClock,
      ...convertHoursToDaysAndHours(gameClock.currentHours),
      //totalPopulation,
      partyMemberString,
      isGM: game.user.isGM,
    };
  };

  /**
  *  @override
  **/
  activateListeners(html) {
    super.activateListeners(html);

    // Dynamically add CSS file
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = localPath('inventoryStyles.css');
    document.head.appendChild(link);
  }
}

const campOptions = {
  template: localPath('campInventory.hbs'),
  title: "Refugee Camp Inventory",
  getConfig: (token) => getCampConfig(canvas.scene, token),
};

const partyOptions = {
  template: localPath('partyInventory.hbs'),
  title: "Scouting Party Inventory",
  getConfig: getPartyConfig,
};

export const openInventoryForm = (token) => {
  const options = isPartyToken(token)
    ? partyOptions
    : campOptions;

    const invApp = new InventoryManager(token, {
      ...options,
      editable: game.user.isGM
    });
    invApp.render(true);
}