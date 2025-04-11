import { moduleCodePath } from "../../constants/paths.js";
import { registerPartial } from "../../helpers/display.js";
import { convertHoursToDaysAndHours } from "../../helpers/math.js";
import { getGameClock } from "../../repos/gameClock.js";
import { getCampConfig, getPartyConfig, isPartyToken } from "../../repos/gameSettings.js";
import { getProvisions, updateProvisions } from "../../repos/provisions.js";

const localPath = (file) => `${moduleCodePath}views/inventory/${file}`;
const getPartialPath = (partial) => localPath(`partials/${partial}.hbs`);

// Register partials
const partials = [
  'provisionFields',
  'partyGroupInfoFields',
  'campGroupInfoFields',
  'timeDataFields',
];
await Promise.all(partials.map(partialName => registerPartial(getPartialPath(partialName), partialName)));

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
      submitOnChange: true,
      closeOnSubmit: false,
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

  _updateObject(event, formData) {
    updateProvisions(this.object, {
      carts: formData.carts,
      foodUnits: formData.foodUnits,
      makeShiftWeapons: formData.makeShiftWeapons,
      medicine: formData.medicine,
      spices: formData.spices,
      weapons: formData.weapons,
    });
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