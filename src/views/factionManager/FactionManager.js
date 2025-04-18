import { moduleCodePath } from "../../constants/paths.js";
import { repLevels } from "../../factions/factionInfo.js";
import { getFactionData, setFactionData, updateFactionRep } from "../../factions/factions.js";
import { loadStylesheet } from "../../helpers/display.js";

const localPath = (file) => `${moduleCodePath}views/factionManager/${file}`;

class FactionManager extends FormApplication {
  constructor(scene, options = {}) {
    super(scene, options);
    loadStylesheet(localPath("factionManager.css"));
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "cs-hex-faction-manager",
      title: "Faction Manager",
      template: localPath("factionManager.hbs"),
      width: 600,
      height: "auto",
      closeOnSubmit: true,
      submitOnClose: true,
      submitOnChange: true,
      editable: game.user.isGM
    });
  }

  async getData() {
    // Initialize factions if not already initialized
    let factionData = getFactionData(this.object);
    if (!factionData) {
      ui.notifications.error("No faction data found");
    }

    // Calculate the number of refugees for each faction
    factionData = factionData.map(faction => {
      const { total, infirm, warriors, foragers } = faction.population;
      faction.population.refugees = total - infirm - warriors - foragers;
      return faction;
    });

    // Calculate totals across all factions
    const totals = factionData.reduce((acc, faction) => {
      acc.total += faction.population.total;
      acc.infirm += faction.population.infirm;
      acc.warriors += faction.population.warriors;
      acc.foragers += faction.population.foragers;
      acc.refugees += faction.population.refugees;
      return acc;
    }, { total: 0, infirm: 0, warriors: 0, foragers: 0, refugees: 0 });
  
    return {
      factions: factionData,
      totals,
      repLevels,
    };
  }

  async _updateObject(event, formData) {
    // Only the GM can update faction data
    if (!game.user.isGM) {
      ui.notifications.warn("Only the GM can edit factions.");
      return;
    }

    // Update faction data
    await setFactionData(this.object, formData.factions);
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    // Handle dropdown changes for reputation
    html.find(".rep-dropdown").on("change", async (event) => {
      const selectElement = event.currentTarget;
      const factionId = selectElement.dataset.factionId;
      const newRep = selectElement.value;

      await updateFactionRep(this.object, factionId, newRep);

      // Optionally, re-render the form to reflect the changes
      this.render(true);
    });
  }
}

export const launchFactionManager = (scene) => {
  const factionManager = new FactionManager(scene).render(true);
  return factionManager;
};
