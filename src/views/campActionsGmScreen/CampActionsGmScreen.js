import { bonusTypes } from "../../constants/campActions/checkOnFaction.js";
import { campActionsData, getActivityById } from "../../constants/campActions/index.js";
import { moduleCodePath } from "../../constants/paths.js";
import { loadStylesheet, registerPartial } from "../../helpers/display.js";
import { requestSkillCheckActionName } from "../../helpers/entityTools.js";
import { generateGUID } from "../../helpers/misc.js";
import { getCurrentDay } from "../../repos/gameClock.js";
import {
  getAttritionBonusInfo,
  getCampToken,
  getGmActionsVM,
  getLockedActions,
  gmCampActionsAppId,
  saveAttritionBonusInfo,
  saveGmActionsVM
} from "../../repos/gameSettings.js";
import { executeForActorsAsync } from "../../socket.js";
import { getEnrichedActivityData } from "../campActions/campActionsState.js";
import { loadGmActionList } from "../common/gmActionsList/gmActionsList.js";

const localPath = (file) => `${moduleCodePath}views/campActionsGmScreen/${file}`;
const getPartialPath = (partialName) => localPath(`partials/${partialName}.hbs`);

await loadGmActionList();

// Generate file paths and register the partials
const partials = [
  'bonusDisplay',
  'preExistingBonuses',
];
await Promise.all(partials.map(partialName => registerPartial(getPartialPath(partialName), partialName)));

Handlebars.registerHelper("getBonusDisplayName", function(type) {
  const friendlyNames = {
    factionReputationAdjust: "Faction Reputation Adjustment",
    factionLeaderBonus: "Faction Leader Bonus",
    makeShiftSpearProduction: "Makeshift Spear Production",
    cookingBonus: "Cooking Bonus",
    medicineAdjustment: "Medicine Adjustment",
    infirmHealed: "Infirm Healed",
    medicineBoost: "Medicine Boost",
    nightlyForageBoost: "Nightly Forage Boost",
    moraleBoost: "Morale Boost",
    combatBoost: "Combat Boost"
  };

  return friendlyNames[type] || "Unknown Bonus";
});

class CampActionsGmScreen extends FormApplication {
  actionsByActivity = [];
  bonuses = [];

  constructor(scene, data, options) {
    super(scene, options); // Results already filtered to the day
    this.currentDay = data.currentDay; // Track the current day
    this.updateFromScene({ suppressRefresh: true });

    loadStylesheet(localPath("campActionsGmScreen.css"));
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: localPath("campActionsGmScreen.hbs"), // Template for the form
      id: gmCampActionsAppId,
      title: `Camp Actions - Day ${this.currentDay}`, // Title for the specified day
      height: (canvas.screenDimensions?.[1] ?? 600) * 0.8,
      width: (canvas.screenDimensions?.[0] ?? 800) * (2 / 3),
    });
  }

  getData() {
    // const activities = Object.keys(actionsByActivity)

    // const provisions = getProvisions(getCampToken(canvas.scene));
    // const context = { provisions };
    const currentDay = this.currentDay;
    this.actionsByActivity = buildVM(this.lockedActions, this.bonuses, this.actionsByActivity);

    const gmActionVms = createGmActionVms((getLockedActions(this.object, this.currentDay) || []), this.assignedActor.id);
  
    return {
      actionsByActivity: this.actionsByActivity,
      currentDay,
      preExistingBonuses: this.preExistingBonuses,
      gmActionVms,
    };
  }

  updateActions({ suppressRefresh = false } = {}) {
    this.lockedActions = getLockedActions(this.object, this.currentDay) || []; 

    if (!suppressRefresh) {
      this.render(true);
    }
  }

  async updateFromScene({ suppressRefresh = false } = {}) {
    this.lockedActions = getLockedActions(this.object, this.currentDay) || []; 
    const bonuses = getAttritionBonusInfo(this.object);
    this.preExistingBonuses = bonuses.filter(b =>
      !b.wasApplied
      && b.createdDay !== this.currentDay
      && b.type !== bonusTypes.message
    );
    this.bonuses = bonuses.filter(b => b.createdDay === this.currentDay);
    this.actionsByActivity = buildVM(this.lockedActions, this.bonuses, rehydrateVM(getGmActionsVM(this.object, this.currentDay)));

    if (!suppressRefresh) {
      this.render(true);
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Toggle details visibility on click
    html.on("click", ".cs-hc-activity-title", (event) => {
      const title = event.currentTarget;
      const details = title.nextElementSibling; // Details div is the next sibling
      details.classList.toggle("cs-hc-hidden");
    });

    html.on("click", ".cs-hc-perform-button", (event) => {
      const actionId = event.currentTarget.dataset.actionId;
      const activityId = event.currentTarget.dataset.activityId;
      this.callForPerformance(activityId, actionId);
    });
    
    html.on("click", ".cs-hc-clear-button", async (event) => {
      try {
        await Promise.all([
          saveGmActionsVM(this.object, this.currentDay, []),
          saveAttritionBonusInfo(this.object, []),
        ]);
        // await this.updateObject(updatedData);
        ui.notifications.info("Results successfully saved!");
        this.updateFromScene();
      } catch (error) {
        console.error("Error saving results:", error);
        ui.notifications.error("Failed to save results. Please try again.");
      }
    });
    // Add event listener for roll buttons
    html.on("click", ".roll-button", async (event) => {
      const button = event.currentTarget;

      // Disable the button to prevent duplicate rolls
      // button.disabled = true;

      // Get activity ID to identify which activity is rolling
      const activityId = button.dataset.activityId;

      // Find activity data by ID
      const activityData = this.results.find(a => a.id === activityId);
      const baseActivity = campActionsData.find(a => a.id === activityId);
      if (!activityData) {
        console.error(`Activity data not found for ID: ${activityId}`);
        button.disabled = false;
        return;
      }

      // Trigger roll logic
      const results = await this.performRolls(activityData, baseActivity);

      // Display results
      this.displayResults(html, activityId, results);

      // Re-enable button after processing (optional)
      button.disabled = false;
    });

    html.on("click", ".cs-hc-save-results-button", (event) => {
      this.saveResults();
    });

    // Add listener for extra buttons
    html.on("change", ".extra-button[type='checkbox']", (event) => this.runExtraButtonAction(event));
    html.on("click", ".extra-button[type='button']", (event) => this.runExtraButtonAction(event));
  }

  runExtraButtonAction(event) {
    const button = event.target;
    const activityId = button.dataset.activityId;
    const actionId = button.dataset.actionId;
    const buttonId = button.dataset.buttonId;
    const activityVM = this.actionsByActivity.find(activityVM => activityVM.id === activityId);
    const performanceVM = activityVM?.performances.find(p => p.id === actionId);
    const buttonConfig = (performanceVM?.extraButtons ?? []).find(btn => btn.id === buttonId);
    const context = _buildBonusContext(performanceVM, activityId);
    const newBonuses = buttonConfig.action(event, context);
    
    this.updateBonuses(newBonuses);
    this.render(true);
  }

  updateBonuses(newBonuses) {
    this.bonuses = [
      ...this.bonuses,
      ...newBonuses,
    ];
  }

  async close(options) {
    await this.saveResults();
    return super.close(options);
  }

  async saveResults() {
    try {
      await saveGmActionsVM(this.object, this.currentDay, this.actionsByActivity);
      await saveAttritionBonusInfo(this.object, [...this.bonuses, ...this.preExistingBonuses]);
      // await this.updateObject(updatedData);
      ui.notifications.info("Results successfully saved!");
    } catch (error) {
      console.error("Error saving results:", error);
      ui.notifications.error("Failed to save results. Please try again.");
    }
  }

  async callForPerformance(activityId, actionId) {
    const activityVM = this.actionsByActivity.find(activityVM => activityVM.id === activityId);

    const performance = activityVM?.performances.find(p => p.id === actionId);
    if (!activityVM.isNoCheck) {
      const performanceRollJob = executeForActorsAsync(
        requestSkillCheckActionName,
        [performance.performerId],
        performance.skillCode,
      );

      const aidRollJobs = performance.aids.map((action) => executeForActorsAsync(
        requestSkillCheckActionName,
        [action.performerId],
        action.skillCode,
      ));

      const [performanceRollResult, ...aidRollResults] = await Promise.all([
        performanceRollJob,
        ...aidRollJobs,
      ]);

      performance.result = performanceRollResult[performance.performerId];
      let aidTotal = 0;

      for (const aidRollResult of aidRollResults) {
        for (const [actorId, rollResult] of Object.entries(aidRollResult)) {
          const aidAction = performance.aids.find(a => a.performerId === actorId);
          if (aidAction) {
            aidAction.result = rollResult;
            if (aidAction.result.total >= aidAction.skillDetails.dc) {
              aidTotal += 2;
            }
          }
        }
      }

      performance.result.aidTotal = aidTotal;
      performance.result.aidedTotal = performance.result.total + aidTotal;
    }
    
    // const actor = game.actors.get(performance.performerId);
    // const enrichedActivity = {
    //   ...activityVM,
    //   ...getEnrichedActivityData(activityId, actor),
    // };

    const newBonuses = await activityVM.resolveBonuses(this._buildBonusContext(performance, activityId));

    this.updateBonuses(newBonuses);

    this.render(true);
  }

  _buildBonusContext(performanceVM, activityId) {
    return {
      checkResult: performanceVM.result?.aidedTotal ?? 0,
      actionData: performanceVM,
      bonuses: this.bonuses,
      scene: this.object,
      baseBonus: {
        type: bonusTypes.message,
        value: "default bonus",
        category: performanceVM.category,
        wasApplied: false,
        origination: {
          activity: activityId,
          performer: performanceVM.performer,
        },
        createdDay: this.currentDay,
      }
    };
  }

  async _updateObject() { await this.saveResults(); }
}

const sortActivities = (activities) => {
  // Define dependency rules
  const dependencies = {
    organizeForagers: "prepareBanquet",
    gatherFirewood: "prepareBanquet",
    checkOnFaction: "influenceAFaction",
  };

  activities.sort((a, b) => {
    // Initialize comparison result
    let result = 0;

    // 1. Compare by total number of people involved (performers + aides)
    const aPeopleCount = (a.performances || []).reduce((count, perf) => 
      count + 1 + (perf.aids?.length || 0), 0
    );
    const bPeopleCount = (b.performances || []).reduce((count, perf) => 
      count + 1 + (perf.aids?.length || 0), 0
    );

    if (aPeopleCount !== bPeopleCount) {
      result = bPeopleCount - aPeopleCount; // Descending order of people count
    }

    // 2. Compare alphabetically by title if people counts are the same
    if (result === 0) {
      result = a.title.localeCompare(b.title);
    }

    // 3. Apply dependency rules after the first two comparisons
    if (dependencies[a.id] === b.id) {
      result = -1; // 'a' must come before 'b'
    } else if (dependencies[b.id] === a.id) {
      result = 1; // 'b' must come before 'a'
    }

    // Return the final result after evaluating all conditions
    return result;
  });

  return activities;
};

const buildVM = (actions, bonuses, existingVM) => {
  const result = [...existingVM];

  actions.forEach(action => {
    const { activityId, performer, isAid, skillCode, category, performerId } = action;

    let activityVM = result.find(a => a.id === activityId);
    if (!activityVM) {
      // If activity doesn't exist in the result, initialize it
      const baseActivity = campActionsData.find(a => a.id === activityId);
      if (!baseActivity) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      activityVM = {
        ...baseActivity,
        performances: [],
      };
      result.push(activityVM);
    }

    // Find or create groups based on performer and category
    let performanceVM = activityVM.performances
      .find(p => 
        p.category === category
        && (isAid ? true : p.performer === performer)
      );

    // Lookup skill details for enrichment
    // Ensure activty is enriched
    const actor = game.actors.get(performerId);
    const enrichedActivity = getEnrichedActivityData(activityId, actor);
    const skillDetails = (isAid ? enrichedActivity.aidSkills : enrichedActivity.skills)
      .find(skill => skill.skill === skillCode);

    const actionVM = {
      ...action,
      skillDetails,
      // userId,
      id: action.id ?? generateGUID(),
    }

    if (!performanceVM) {
      performanceVM = {
        ...actionVM,
        aids: [],
        bonuses: [],
        messages: [],
        extraButtons: [],
      };
      activityVM.performances.push(performanceVM);
    }

    if (isAid) {
      const existingAid = performanceVM.aids.find(a => a.performerId === actionVM.performerId);
      if (!existingAid) {
        performanceVM.aids.push(actionVM);
      }
    }
    else {
      const performanceBonuses = bonuses.filter(b =>
        b.origination.activity === activityId
        && b.category === category
        && b.origination.performer === performer
      );
      performanceVM.bonuses = performanceBonuses.filter(b => b.type !== bonusTypes.message );
      performanceVM.messages = performanceBonuses.filter(b => b.type === bonusTypes.message );
    }
  });

  return sortActivities(result);
};

const rehydrateVM = (existingVM) => existingVM.map(actionRow => {
  const baseActivity = (getActivityById(actionRow.id) ?? []);
  return {
    ...baseActivity,
    ...actionRow,
    extraButtons: actionRow.extraButtons ?? [], // make sure these aren't overwritten by functionless data
  };
});

// const buildVMResult = [
//   {
//     ...activity,
//     performances: [
//       {
//         ...actionVM,
//         aids: [
//           actionVM,
//         ]
//       }
//     ]
//   }
// ];

export const launchCampActionsGmScreen = async (scene) => {
  const currentDay = getCurrentDay(getCampToken(scene));
  const campActionsGmScreen = new CampActionsGmScreen(scene, {
    currentDay
  }).render(true);

  return campActionsGmScreen;
};

