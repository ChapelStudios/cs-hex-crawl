import { campActionsData } from "../../constants/campActions/index.js";
import { testCampActions } from "../../constants/campActionss.js";
import { moduleCodePath } from "../../constants/paths.js";
import { registerPartial } from "../../helpers/display.js";
import { getCurrentDay } from "../../repos/gameClock.js";
import { getCampToken, getLockedActions, processActionRolls } from "../../repos/gameSettings.js";
import { getProvisions } from "../../repos/provisions.js";

const localPath = (file) => `${moduleCodePath}views/campActionsGmScreen/${file}`;
const getPartialPath = (partialName) => localPath(`partials/${partialName}.hbs`);

// Generate file paths and register the partials
const partials = [
  'improveMedicine',
  'noPerformersWarning',
  'skill-results',
];
partials.forEach(partialName => {
  const filePath = getPartialPath(partialName);
  registerPartial(filePath, partialName);
});

class CampActionsGmScreen extends FormApplication {
  constructor(scene, data, options) {
    super(scene, options);
    this.lockedActions = data.lockedActions || []; // Results already filtered to the day
    this.currentDay = data.currentDay; // Track the current day
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      template: localPath("campActionsGmScreen.hbs"), // Template for the form
      title: `Camp Actions - Day ${this.currentDay}`, // Title for the specified day
      width: 800,
      height: "auto",
    });
  }

  _createContext = (context, action) => ({
    provisions: context.provisions,
    performers: action.performers,
    aides: action.aides,
  });

  getData() {
    const actionsByActivity = groupByActivityAndPerformer(this.lockedActions);
    const activities = Object.keys(actionsByActivity)

    const provisions = getProvisions(getCampToken(canvas.scene));
    const currentDay = this.currentDay;
    const context = { provisions };
  
    return {
      activities
    };
  }
  

  activateListeners(html) {
    super.activateListeners(html);

    // Dynamically load CSS for styling
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = localPath("campActionsGmScreen.css");
    document.head.appendChild(link);

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
  }

  async performRolls(activityData, baseActivity) {
    const results = await processActionRolls(activityData, baseActivity);
  
    // Process each skill's result
    const skillResults = activityData.skills.map(skill => {
      const skillRoll = results.performers.find(performer => performer.skill === skill.skill);
      return {
        skill: skill.skill,
        display: skill.display,
        rollResult: skillRoll?.rollResult?.total || 0,
      };
    });
  
    const performerResult = results.performers[0].rollResult.total; // Example: Single performer logic
    let activityCheckResult = performerResult;
  
    // Add aide bonus
    results.aides.forEach(aide => {
      if (aide.rollResult.total > 9) {
        activityCheckResult += 2;
      }
    });
  
    return {
      performerResult,
      activityCheckResult,
      skillResults,
      aides: results.aides,
    };
  }
  
  displayResults(html, activityId, results) {
    const activityElement = html.find(`.activity[data-activity-id="${activityId}"]`);
    const resultsSection = activityElement.find(".results-section");
  
    // Update skill results
    const skillResults = results.skillResults.map(skill => `
      <li>Skill: ${skill.display}, Roll: ${skill.rollResult}</li>
    `).join("");
  
    resultsSection.find(".performer-result").text(`Performer Roll: ${results.performerResult}`);
    resultsSection.find(".aide-results").html(results.aides.map(aide => `
      <li>${aide.name} - Roll: ${aide.rollResult.total} (Skill: ${aide.skillDisplay}, DC: ${aide.dc})</li>
    `).join(""));
    resultsSection.find(".skill-results").html(skillResults);
    resultsSection.find(".final-result").text(`Final Activity Check Result: ${results.activityCheckResult}`);
    resultsSection.removeClass("hidden");
  }
  
}

const groupByActivityAndPerformer = (actions) => {
  return actions.reduce((acc, row) => {
    const { activityId, performer, isAid } = row;

    // Ensure activity group exists
    if (!acc[activityId]) {
      acc[activityId] = { aides: {}, performers: {} };
    }

    // Determine the correct subgroup
    const group = isAid ? acc[activityId].aides : acc[activityId].performers;

    // Ensure performer group exists
    if (!group[performer]) {
      group[performer] = [];
    }

    // Add the row to the correct group
    group[performer].push(row);

    return acc;
  }, {});
}

export const launchCampActionsGmScreen = async (scene) => {
  const currentDay = getCurrentDay(getCampToken(scene));
  const lockedActions = testCampActions;
  // const combinedResults = getLockedActions(scene, currentDay);

  // // Step 1: Find actions without performers but with aides
  // const noPerformerActions = combinedResults.filter(
  //   action => action.performers.length === 0 && action.aides.length > 0
  // );

  // // Step 2: Warn the GM if such actions exist
  // if (noPerformerActions.length > 0) {
  //   const warningDetails = noPerformerActions.map(action => {
  //     return `Action: "${action.title}" has aides:\n`
  //       + action.aides
  //         .map(aide => `- ${aide.name} (Skill: ${aide.skillDisplay}, DC: ${aide.dc})`)
  //         .join("\n");
  //   }).join("\n\n");

  //   ui.notifications.warn("Some actions have aides but no performers. Check the console for details.");
  //   console.log("Actions with aides but no performers:\n", warningDetails);
  // }

  // Pass all results, without filtering, to the GM screen
  const campActionsGmScreen = new CampActionsGmScreen(scene, {
    lockedActions,
    currentDay
  }).render(true);

  return campActionsGmScreen;
};

