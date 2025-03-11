import { circumstances } from "../../constants/attrition/circumstances.js";
import { moduleBasePath } from "../../constants/paths.js";
import { factions } from "../../factions/factionInfo.js";
import { getCampToken } from "../../repos/gameSettings.js";

const localPath = (file) => `${moduleBasePath}views/attritionManager/${file}`;

// Register partials
// Handlebars.registerPartial('campActions', await fetch(localPath('campActions.hbs')).then(response => response.text()));

class AttritionManager extends FormApplication {
  constructor(token, data, options) {
    super(token, options);
    this.circumstances = data.circumstances || [];
    this.factions = data.factions || {};
    this.farSightCounter = 0; // Initialize Far Sight counter
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: localPath("attritionManager.hbs"), // Main template
      title: "Attrition Manager",
      width: 600
    });
  }

  getData() {
    return {
      circumstances: this.circumstances,
      factions: this.factions
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Dynamically load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = localPath("attritionManager.css");
    document.head.appendChild(link);

    // Enable/Disable Gathered Firewood based on Cook checkbox
    html.on("change", ".cook-checkbox", (event) => {
      const isChecked = event.target.checked;
      html.find(".firewood-checkbox").prop("disabled", !isChecked);
    });

    // Increment Far Sight counter
    html.on("click", ".far-sight-button", (event) => {
      this.farSightCounter++;
      html.find(".far-sight-counter").text(this.farSightCounter);
    });
  }

  async _updateObject(event, formData) {
    // Handle submitted form data here
    console.log("Form Data:", formData);
    console.log("Far Sight Counter:", this.farSightCounter);
  }
}

export const launchAttritionManager = (scene) => {
  const campToken = getCampToken(scene);
  const factionManager = new AttritionManager(campToken, {
    circumstances,
    factions,
  }).render(true);
  return factionManager;
};