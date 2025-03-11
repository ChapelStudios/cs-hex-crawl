import { campActionsData } from "../../constants/campActions/index.js";
import { artPath, moduleBasePath } from "../../constants/paths.js";
import { disambiguateSkillCode, getNestedProperty } from "../../helpers/entityTools.js";
import { getCurrentDay } from "../../repos/gameClock.js";
import { campActionsAppId, getCampToken, getCurrentCampActions, getPartyMemberList, refreshCampActionsHandlerName, saveActionsRequestActionName, updateCurrentCampActions } from "../../repos/gameSettings.js";
import { getProvisions } from "../../repos/provisions.js";
import { dl3HexCrawlSocket } from "../../socket.js";

const localPath = (file) => `${moduleBasePath}views/campActions/${file}`;

class CampActions extends FormApplication {
  constructor(scene, data, options) {
    super(scene, options);
    this.activities = data.activities || []; // List of activities
    this.selectedHours = 0; // Track total selected hours
    this.maxHours = 6; // Maximum time allowed
    this.completedActions = {}; // Track completed actions by index
    this.aids = {}; // Track aids by index
    this.currentDay = data.currentDay; // Current day
    this.assignedActor = data.assignedActor; // Actor assigned to the user
    // Global state: mapping of non-repeatable action ID to a count (should be 0 or 1)
    this.globalCompletedActions = data.globalCompletedActions || {};
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: campActionsAppId,
      template: localPath("campActions.hbs"), // Template for the form
      title: "Camp Actions",
      width: 1200,
      height: "auto",
    });
  }

  _createContext(activity) {
    return {
      activity,
      provisions: getProvisions(getCampToken(canvas.scene)),
      assignedActor: this.assignedActor,
    };
  }

  getData() {
    const actorSkills = this.assignedActor.system.skills;
    const activities = this.activities.map(activity => {
      const marshalledActivity = {
        ...activity,
        ...activity.getSelectionData?.(this._createContext(activity)) || {},
      };
      // Build perform skill choices: check actor's nested skill ranks.
      const performSkillChoices = (marshalledActivity.skills || []).map(skill => {
        const actorRanks = getNestedProperty(actorSkills, skill.skill)?.rank || 0;
        const meetsRequirement = actorRanks >= skill.rankRequirement;
        return {
          value: skill.skill,
          label: `${skill.display} (Rank: ${skill.rankRequirement})`,
          disabled: !meetsRequirement
        };
      });
      const hasValidPerformSkills = performSkillChoices.some(choice => !choice.disabled);

      // Build aid skill choices: require at least 1 rank.
      const aidSkillChoices = (marshalledActivity.aidSkills || []).map(skill => {
        const disambiguatedSkillCode = disambiguateSkillCode(skill.skill);
        const meetsRequirement = disambiguatedSkillCode === false
          || (getNestedProperty(actorSkills, disambiguatedSkillCode)?.rank || 0) > 0;
        const label = (skill.dc === 10) ? skill.display : `${skill.display} [DC ${skill.dc}]`;
        return { value: skill.skill, label, disabled: !meetsRequirement };
      });
      const hasValidAidSkills = aidSkillChoices.some(choice => !choice.disabled);

      return {
        ...marshalledActivity,
        performSkillChoices,
        aidSkillChoices,
        hasValidPerformSkills,
        hasValidAidSkills,
      };
    });

    return {
      activities,
      maxHours: this.maxHours,
      checkmarkImage: artPath("checkmark.png"),
      selectedHours: this.selectedHours
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Register a socket listener to update global state on non-repeatable actions.
    dl3HexCrawlSocket.register("updateGlobalCompletedActions", data => {
      this.globalCompletedActions = data;
      this.updateUI(html);
    });

    // Load the CSS file dynamically.
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = localPath("campActions.css");
    document.head.appendChild(link);

    // Handle the Perform Action button click.
    html.on("click", ".cs-dl3-activity-action", async (event) => {
      const actionIndex = parseInt($(event.currentTarget).data("action-index"), 10);
      const activity = this.activities[actionIndex];
    
      // Update global state for "Perform Action"
      if (!activity.repeatable) {
        await this.updateGlobalState(activity.id, 1, false, activity.useIndependentTracking);
      }
    
      // Update local state for check marks
      this.completedActions[actionIndex] = (this.completedActions[actionIndex] || 0) + 1;
      this.selectedHours += activity.timeCost;
    
      // Disable "Aid Another" options for this activity
      const activityElement = $(event.currentTarget).closest(".cs-dl3-activity");
      activityElement.find(".cs-dl3-aid-another-action").prop("disabled", true);
      activityElement.find(".cs-dl3-aid-skill-select").prop("disabled", true);
    
      // Refresh UI
      this.updateUI(html);
    });
    
    // Handle the Aid Another button click.
    html.on("click", ".cs-dl3-aid-another-action", async (event) => {
      const actionIndex = parseInt($(event.currentTarget).data("action-index"), 10);
      const activity = this.activities[actionIndex];
    
      // Update global state for Aid Another
      await this.updateGlobalState(activity.id, 0, true);
    
      // Increment local state for aiding
      this.aids[actionIndex] = (this.aids[actionIndex] || 0) + 1;
    
      // Refresh the UI
      this.updateUI(html);
    });

    // Toggle the details panel when clicking the title or toggle icon.
    html.on("click", ".cs-dl3-activity-title, .cs-dl3-details-toggle", event => {
      const activityElem = $(event.currentTarget).closest(".cs-dl3-activity");
      const details = activityElem.find(".cs-dl3-activity-details");
      details.toggleClass("cs-dl3-hidden");
  
      const toggleIcon = activityElem.find(".cs-dl3-details-toggle i");
      if (details.hasClass("cs-dl3-hidden")) {
        toggleIcon.removeClass("fa-circle-caret-up").addClass("fa-circle-caret-down");
      } else {
        toggleIcon.removeClass("fa-circle-caret-down").addClass("fa-circle-caret-up");
      }
    });
  
    // Allow the user to unselect an action by clicking its checkmark.
    html.on("click", ".cs-dl3-checkmark", async (event) => {
      event.stopPropagation();
      const actionIndex = parseInt($(event.currentTarget).data("action-index"), 10);
      const isAid = $(event.currentTarget).data("aid"); // Check if this is an "Aid Another" action
      const activity = this.activities[actionIndex];
    
      if (isAid && this.aids[actionIndex] && this.aids[actionIndex] > 0) {
        // Decrement local state for aids
        this.aids[actionIndex]--;
        
        // Remove from global aid helpers
        const helpers = this.globalCompletedActions[activity.id]?.helpers || [];
        const updatedHelpers = helpers.filter(helper => helper !== this.assignedActor?.name);
        this.globalCompletedActions[activity.id] = {
          ...(this.globalCompletedActions[activity.id] || {}),
          helpers: updatedHelpers,
        };
      } else if (!isAid && this.completedActions[actionIndex] && this.completedActions[actionIndex] > 0) {
        // Decrement local state for completed actions
        this.completedActions[actionIndex]--;
        this.selectedHours -= activity.timeCost;
        if (this.selectedHours < 0) this.selectedHours = 0;
    
        // Reset global state for non-repeatable actions
        if (!activity.repeatable) {
          if (activity.useIndependentTracking) {
            // For independent tracking, remove only this actor's entry
            let currentGlobal = this.globalCompletedActions[activity.id];
            if (currentGlobal && currentGlobal.performers) {
              const updatedPerformers = currentGlobal.performers.filter(name => name !== this.assignedActor?.name);
              if (updatedPerformers.length > 0) {
                currentGlobal.performers = updatedPerformers;
                currentGlobal.count = updatedPerformers.length;
                this.globalCompletedActions[activity.id] = currentGlobal;
              } else {
                this.globalCompletedActions[activity.id] = 0;
              }
              await updateCurrentCampActions(this.object, this.globalCompletedActions);
              dl3HexCrawlSocket.executeForOthers(refreshCampActionsHandlerName);
            }
          } else {
            // For non-independent tracking, reset the global state
            await this.updateGlobalState(activity.id, 0);
          }
        }
      }
    
      // Refresh the UI
      this.updateUI(html);
    });
    
    this.updateUI(html);
  }

  updateUI(html) {
    html.find(".cs-dl3-activity").each((index, element) => {
      const activity = {
        ...this.activities[index],
        ...this.activities[index].getSelectionData?.(this._createContext(this.activities[index])) || {},
      };
      const performButton = $(element).find(".cs-dl3-activity-action");
      const performSelect = $(element).find(".cs-dl3-skill-select");
      const aidButton = $(element).find(".cs-dl3-aid-another-action");
      const aidSelect = $(element).find(".cs-dl3-aid-skill-select");
  
      // Fetch global state for the current activity
      const globalState = this.globalCompletedActions[activity.id];

      // Update the button text to reflect the performer's name if there is one
      const performerName = globalState?.performerName && !activity.useIndependentTracking
        ? `Performer: ${globalState.performerName}` 
        : "Perform Action";        
      performButton.text(performerName);

      // Independent tracking of performers
      if (activity.useIndependentTracking) {
        // Check if the container for performer names exists; if not, create one.
        let performerNamesDiv = $(element).find(".cs-dl3-performer-names");
        if (!performerNamesDiv.length) {
          performerNamesDiv = $('<div class="cs-dl3-performer-names"></div>');
          // Append the container just after the perform container.
          $(element).find(".cs-dl3-perform-container").after(performerNamesDiv);
        }
        
        // Build a list of performer names.
        let performerList = [];
        if (globalState) {
          // Expect globalState to have either a single performerName or an array of performers.
          if (Array.isArray(globalState.performers)) {
            performerList = globalState.performers;
          } else if (globalState.performerName) {
            performerList = [globalState.performerName];
          }
        }
        
        // Set the text if there are any names, else clear it.
        if (performerList.length > 0) {
          performerNamesDiv.text("Performed by: " + performerList.join(", "));
        } else {
          performerNamesDiv.text("");
        }
      } else {
        // If not independent tracking, remove this extra container in case it exists.
        $(element).find(".cs-dl3-performer-names").remove();
      }      

      const aidRow = $(element).find(".cs-dl3-aid-helpers-row");
      const helpers = globalState?.helpers || [];

      if (helpers.length > 0) {
        const helperNames = helpers.join(", ");
        aidRow.html(`<strong>Aided by:</strong> ${helperNames}`);
      } else {
        aidRow.html(""); // Clear the row if no helpers
      }

      // Rule 1: Disable "Perform Action" if it's a non-repeatable action that's already performed
      const isPerformDisabled = !activity.repeatable 
        && (!activity.useIndependentTracking && globalState?.count > 0);
    
      // Rule 2: Aid is disabled if:
      // - No one has performed the action yet
      // - This actor is the performer
      // - This actor has already aided
      // - There are no viable dropdown options
      const hasValidAidSkills = activity.aidSkills?.some(skill => {
        const actorRanks = getNestedProperty(this.assignedActor.system.skills, skill.skill)?.rank || 0;
        return actorRanks >= 1; // Aid requires at least 1 rank
      });
      const isAidDisabled = !globalState?.performerName // Not performed yet
        || globalState?.performerName === this.assignedActor?.name // Performed by this actor
        || globalState?.helpers?.includes(this.assignedActor?.name) // Already aided
        || !hasValidAidSkills; // No viable dropdown options
  
      // NEW: Check if all options in the dropdown are disabled
      const allPerformOptionsDisabled = performSelect.find("option:not(:disabled)").length === 0;
      const allAidOptionsDisabled = aidSelect.find("option:not(:disabled)").length === 0;
  
      // NEW Rule: Disable if performing or aiding would exceed max hours
      const wouldExceedMaxHours = (this.selectedHours + activity.timeCost) > this.maxHours;

      const aidContainer = $(element).find(".cs-dl3-aid-another-container");

      // Rule: Hide Aid Section for Activities with No Aid Skills
      if (!activity.aidSkills || activity.aidSkills.length === 0) {
        aidContainer.addClass("cs-dl3-hidden");
      } else {
        aidContainer.removeClass("cs-dl3-hidden");
      }
  
      // Combine all rules for "Perform Action"
      const disablePerform = isPerformDisabled || wouldExceedMaxHours || allPerformOptionsDisabled;
      performButton.prop("disabled", disablePerform).toggleClass("cs-dl3-disabled", disablePerform);
      performSelect.prop("disabled", disablePerform).toggleClass("cs-dl3-disabled", disablePerform);
  
      // Combine all rules for "Aid Another"
      const disableAid = isAidDisabled || wouldExceedMaxHours || allAidOptionsDisabled;
      aidButton.prop("disabled", disableAid).toggleClass("cs-dl3-disabled", disableAid);
      aidSelect.prop("disabled", disableAid).toggleClass("cs-dl3-disabled", disableAid);
  
      // Handle check marks for completed actions and aids
      const checkmarkContainer = $(element).find(".cs-dl3-checkmark-container");
      checkmarkContainer.empty(); // Clear previous check marks
  
      // Add checkmarks for completed actions
      const completedCount = this.completedActions[index] || 0;
      for (let i = 0; i < completedCount; i++) {
        checkmarkContainer.append(
          `<img src="${artPath("checkmark.png")}" 
                class="cs-dl3-checkmark" 
                data-action-index="${index}" 
                alt="Performed" 
                style="cursor:pointer;">`
        );
      }
  
      // Add checkmarks for aids
      const aidCount = this.aids[index] || 0;
      for (let i = 0; i < aidCount; i++) {
        checkmarkContainer.append(
          `<img src="${artPath("checkmark.png")}" 
                class="cs-dl3-checkmark cs-dl3-aid-checkmark" 
                data-action-index="${index}" 
                data-aid="true" 
                alt="Aided" 
                style="cursor:pointer;">`
        );
      }
    });
  }
  
  async _updateObject(event, formData) {
    const results = {
      day: this.currentDay,
      id: this.assignedActor.id,
      name: this.assignedActor.name,
      selectedActivities: this.activities.map((activity, index) => {
        const timesPerformed = this.completedActions[index] || 0;
        const selectedSkill = formData[`skill-${index}`]
          ? activity.skills?.find(skill => skill.skill === formData[`skill-${index}`])
          : null;
        return {
          title: activity.title,
          skill: selectedSkill,
          timesPerformed,
          aidSkillUsed: formData[`aid-skill-${index}`]
            ? activity.aidSkills?.find(skill => skill.skill === formData[`aid-skill-${index}`])
            : null
        };
      }).filter(activity => activity.timesPerformed > 0)
    };

    await dl3HexCrawlSocket.executeAsGM(saveActionsRequestActionName, this.object, results);
  }

  async updateGlobalState(activityId, count, isAid = false, isIndependentTracking = false) {
    // Fetch the current global state from the token
    const currentActions = this.globalCompletedActions || getCurrentCampActions(this.object);

    if (isAid) {
      // Handle aid logic
      const helpers = currentActions[activityId]?.helpers || [];
      const performerName = this.assignedActor?.name || "Unknown Actor";
  
      // Avoid duplicate entries
      if (!helpers.includes(performerName)) {
        helpers.push(performerName);
      }
  
      currentActions[activityId] = {
        ...(currentActions[activityId] || {}),
        helpers,
      };
    } else if (isIndependentTracking) {
      // For independent tracking, use an array to accumulate performer names.
      const performer = this.assignedActor?.name || "Unknown Actor";
      if (!currentActions[activityId] || currentActions[activityId] === 0) {
        // Initialize the global state for this activity with an array of performers.
        currentActions[activityId] = { count: 1, performers: [performer], helpers: [] };
      } else {
        // Ensure the performers array exists.
        if (!currentActions[activityId].performers) {
          currentActions[activityId].performers = [];
        }
        // Only add if this performer isn't already in the array.
        if (!currentActions[activityId].performers.includes(performer)) {
          currentActions[activityId].performers.push(performer);
          currentActions[activityId].count++;
        }
      }
    } else {
      // Handle perform action logic
      currentActions[activityId] = count > 0
        ? { count, performerName: this.assignedActor?.name || "Unknown Actor", helpers: [] }
        : 0;
    }
  
    // Save the updated state back to the token
    await updateCurrentCampActions(this.object, currentActions);
    this.globalCompletedActions = currentActions;
    this.updateUI(this.element);
    
    // Notify other clients to refresh their state
    dl3HexCrawlSocket.executeForOthers(refreshCampActionsHandlerName);
  }

  async render(force = false, options = {}) {
    // Call the parent render method
    const result = await super.render(force, options);
  
    // Fetch the latest global state from the token
    this.globalCompletedActions = getCurrentCampActions(this.object);
  
    // Update the UI with the fetched data
    this.updateUI(this.element);
  
    return result;
  }

  async cleanupGlobalState() {
    const currentActions = this.globalCompletedActions || getCurrentCampActions(this.object);
  
    // Remove actions performed or aided by the current user
    Object.keys(currentActions).forEach(activityId => {
      const action = currentActions[activityId];
  
      // Remove perform action if performed by this actor
      if (action.performerName === this.assignedActor?.name) {
        currentActions[activityId] = 0; // Reset to available
      }
  
      // Remove helpers who are this actor
      if (action.helpers?.includes(this.assignedActor?.name)) {
        const updatedHelpers = action.helpers.filter(helper => helper !== this.assignedActor?.name);
        currentActions[activityId] = { ...action, helpers: updatedHelpers };
      }
    });
  
    // Save the updated state back to the token
    await updateCurrentCampActions(this.object, currentActions);
  
    // Notify other clients to refresh their state
    dl3HexCrawlSocket.executeForOthers(refreshCampActionsHandlerName);
  }
  
  async close(options = {}) {
    // Perform global state cleanup
    await this.cleanupGlobalState();
  
    // Call the parent class's close method
    return super.close(options);
  }
}

// Function to show a dialog for selecting an actor
const showActorSelectionDialog = (partyMembers) => {
  return new Promise((resolve) => {
    new Dialog({
      title: "Select Actor for Camp Actions",
      content: `
        <form>
          <div class="form-group">
            <label for="actor-select">Choose an Actor:</label>
            <select id="actor-select" name="actor">
              ${partyMembers
                .map(
                  (actor) =>
                    `<option value="${actor.id}">${actor.name}</option>`
                )
                .join("")}
            </select>
          </div>
        </form>
      `,
      buttons: {
        confirm: {
          label: "Confirm",
          callback: (html) => {
            const actorId = html.find("#actor-select").val();
            resolve(actorId); // Resolve with the selected actor ID
          },
        },
        cancel: {
          label: "Cancel",
          callback: () => {
            resolve(null); // Resolve with null if cancelled
          },
        },
      },
      default: "confirm",
    }).render(true);
  });
};

export const launchCampActions = async (scene, token) => {
  // Get the actor assigned to the user
  const assignedActor = game.actors.get(game.user.character?.id);

  // If no assigned actor and user is GM, prompt for selection
  if (!assignedActor && game.user.isGM) {
    const partyMembers = getPartyMemberList(); // Use this function to get the party member list

    if (!partyMembers || partyMembers.length === 0) {
      ui.notifications.warn("No party members available to select.");
      return false;
    }

    // Show dialog to select an actor
    const actorId = await showActorSelectionDialog(partyMembers);

    // If no actor was selected, cancel the operation
    if (!actorId) {
      ui.notifications.error("No valid actor selected.");
      return false;
    }

    const selectedActor = game.actors.get(actorId);

    const campActionsManager = new CampActions(scene, {
      activities: campActionsData,
      assignedActor: selectedActor,
      currentDay: getCurrentDay(token),
      globalCompletedActions: getCurrentCampActions(scene),
    }).render(true);

    return campActionsManager;
  }

  // If an actor is already assigned or the user is not a GM, proceed as normal
  if (!assignedActor) {
    ui.notifications.error("You must be assigned an actor to use Camp Actions.");
    return false;
  }

  const campActionsManager = new CampActions(scene, {
    activities: campActionsData,
    assignedActor,
    currentDay: getCurrentDay(token),
    globalCompletedActions: getCurrentCampActions(scene),
  }).render(true);

  return campActionsManager;
};
