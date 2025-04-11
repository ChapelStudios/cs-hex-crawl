import { CampActionsState } from "./campActionsState.js";
import * as UI from "./campActionsUI.js";
import {
  campActionsAppId,
  getUserActionsForDay,
  getCampToken,
} from "../../repos/gameSettings.js";
import { artPath, moduleCodePath } from "../../constants/paths.js";
import { loadStylesheet } from "../../helpers/display.js";
import { generateSkillChoices } from "../../helpers/entityTools.js";
import { getProvisions } from "../../repos/provisions.js";
import { campActionsData, getActivityById } from "../../constants/campActions/index.js";
import { createGmActionVms, loadGmActionList } from "../common/gmActionsList/gmActionsList.js";

const localPath = file => `${moduleCodePath}views/campActions/${file}`;
await loadGmActionList();

export class CampActions extends FormApplication {
  constructor(scene, data, options) {
    super(scene, options);
    // Core setup
    this.currentDay = data.currentDay;
    this.assignedActor = data.assignedActor;
    this.options.title = `Camp Actions - ${data.assignedActor.name}`;
    this.maxHours = data.maxHours ?? 6;
    
    // Instead of keeping global state directly, encapsulate it in a dedicated manager.
    this.stateManager = new CampActionsState(scene, data.assignedActor, this.updateUI.bind(this), data.currentDay);

    loadStylesheet(localPath("campActions.css"));
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: campActionsAppId,
      template: localPath("campActions.hbs"),
      title: "Camp Actions",
      resizable: true,
      width: canvas.screenDimensions.width * (7 / 9),
      height: canvas.screenDimensions.height * (5 / 7),
    });
  }

  // async close(options = {}) {
  //   await this.stateManager.deleteUnlockedRowsForActor();
  //   return super.close(options);
  // }

  getData() {
    const activities = campActionsData.map(activity => this._prepareActivity(activity));

    const gmActionVms = createGmActionVms(this.stateManager.getActivitiesState(), this.assignedActor.id);
    
    return {
      activities,
      remainingHours: this.getRemainingHours(),
      checkmarkImage: artPath("checkmark.png"),
      isGM: game.user.isGM,
      gmActionVms,
    };
  }
  
  _prepareActivity(activity) {
    const enriched = this._getEnrichedActivity(activity);
    const performSkillChoices = generateSkillChoices(this.assignedActor, enriched.skills, 'perform');
    const aidSkillChoices = generateSkillChoices(this.assignedActor, enriched.aidSkills, 'aid');
    const completedCount = this._getCompletedCount(activity);
    
    return {
      ...enriched,
      performSkillChoices,
      aidSkillChoices,
      hasValidPerformSkills: performSkillChoices.some(choice => !choice.disabled),
      hasValidAidSkills: aidSkillChoices.some(choice => !choice.disabled),
      completedCount,
      hasPerformed: completedCount > 0
    };
  }
  
  _getEnrichedActivity(activity) {
    return {
      ...activity,
      ...activity.getEnrichedData?.({
        activity,
        provisions: getProvisions(getCampToken(canvas.scene)),
        assignedActor: this.assignedActor
      }) || {}
    };
  }
  
  _getCompletedCount(activity) {
    const dayActions = getUserActionsForDay(canvas.scene, this.currentDay);
    const record = dayActions.find(record => record.id === activity.id);
    return record?.timesPerformed || 0;
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    this.updateUI(html);
    
    html.on("click", ".cs-dl3-activity-action", event => this._handlePerformAction(event, html));
    html.on("click", ".cs-dl3-aid-another-action", event => this._handleAidAction(event, html));
    html.on("click", ".cs-dl3-activity-title, .cs-dl3-details-toggle", event => this._toggleDetails(event));
    html.on("click", ".cs-dl3-checkmark img", event => this._handleUnselectAction(event, html));
    html.on("click", ".cs-dl3-clear-button", async () => await this.stateManager.deleteUnlockedRowsForActor());

    // GM Stuff
    html.on("click", ".cs-dl3-clear-global-button", async () => {
      if (!game.user.isGM) return;
      this.stateManager.resetState();
    });
    html.on("click", ".cs-dl3-clear-locked-button", async () => {
      if (!game.user.isGM) return;
      this.stateManager.deleteAllRowsForActor();
    });

    html.on("click", ".actions-header", () => {
      const table = html.find(".actions-details");
      table.toggleClass("hidden");
    });
    html.on("click", ".refresh-button", () => {
      this.stateManager.refreshStateFromScene();
      this.render(true);
    });
    html.on("click", ".gm-actions-container .remove-button", (event) => {
      event.stopPropagation();
      const clickedButton = $(event.currentTarget);
  
      const actionId = clickedButton.data("action-id");

      this.stateManager.removeAction(actionId);
      this.render(true);
    });
  }

  async updateUI(html) {
    if (!html) {
      html = this.element;
    }

    const elements = html.find(".cs-dl3-activity");
    const remainingHours = this.getRemainingHours();

    for (let i = 0; i < elements.length; i++) {
      const element = elements.eq(i);
      const activity = this._getEnrichedActivity(campActionsData[i]);
      const activityActions = this.stateManager.getActivityActions(activity.id)
        .filter(a => a.count > 0);
      const activityPerformance = activityActions.find(a => a.isAid === false) || null;
      const timeCost = activityPerformance?.costOverride ?? activity.timeCost;
      const hasEnoughHoursForActivity = (remainingHours - timeCost) >= 0;
      
      await UI.updateActivityUI(
        element,
        activity,
        activityActions,
        this.assignedActor,
        hasEnoughHoursForActivity
      );
    }

    UI.updateRemainingHours(html, this.getRemainingHours());
  }

  getRemainingHours() {
    return this.maxHours - this.stateManager.getHoursForPerformer();
  }

  async _updateObject(event, formData) {
    this.stateManager.lockActivitiesForPerformer();
  }
  
  async _handleUnselectAction(event, html) {
    event.stopPropagation();
    const clickedCheckmark = $(event.currentTarget);

    // Prevent changes for locked activities.
    const isLocked = clickedCheckmark.data("locked") ?? false;
    if (isLocked) {
      return;
    }
    const activityId = clickedCheckmark.data("action");
    const isAid = clickedCheckmark.data("aid") || false;
    const skillCode = clickedCheckmark.data("skill") || '';
    const activity = this._getEnrichedActivity(getActivityById(activityId));
    // const skill = activity.skills?.find(skill => skill.skill === skillCode);
    let extraData = {};

    if (typeof activity.onUserUnselect === "function") {
      // const context = this._getEnrichedActivityContext(activity);
      extraData = await activity.onUserUnselect({
        activityActions: this.stateManager.getActivityActions(activity.id),
        actorName: this.assignedActor.name,
        isAid,
        skillCode,
      });

      if (extraData.isCancel) {
        // During the onUserPerform call, this action was canceled.
        return;
      }
      else {
        delete extraData.isCancel;
      }
    }

    await this.stateManager.addOrUpdateActivity(
      activity.id,
      skillCode,
      { isAid, isCountDecrement: true, extraData });


    if (game.user.isGM) {
      this.render(true);
    }
  }

  // Event handler: Perform an action
  async _handlePerformAction(event, html) {
    event.stopPropagation();
    const clickedButton = $(event.currentTarget);

    const actionIndex = parseInt(clickedButton.data("action-index"), 10);
    const activity = this._getEnrichedActivity(campActionsData[actionIndex]);
    const activityElement = clickedButton.closest(".cs-dl3-activity");
    const selectedSkillCode = activityElement.find('.cs-dl3-skill-select')?.val() || 0;
    let extraData = {};
  
    // Execute onUserPerform callback if defined and lock the activity.
    if (typeof activity.onUserPerform === "function") {
      // const context = this._getEnrichedActivityContext(activity);
      extraData = await activity.onUserPerform({
        activityActions: this.stateManager.getActivityActions(activity.id),
        isAid: false,
        actorName: this.assignedActor.name,
        app: this,
        skill: activity.skills.find(s => s.skill === selectedSkillCode),
        remainingHours: this.getRemainingHours(),
      });

      if (extraData.isCancel) {
        // During the onUserPerform call, this action was canceled.
        return;
      }
      else {
        delete extraData.isCancel;
      }
    }

    // Increment local completed actions and selected hours.
    await this.stateManager.addOrUpdateActivity(
      activity.id,
      selectedSkillCode,
      { locked: activity.lockAfterPerform, extraData }
    );

    if (game.user.isGM) {
      this.render(true);
    }
  }

  // Event handler: Aid another action
  async _handleAidAction(event, html) {
    const actionIndex = parseInt($(event.currentTarget).data("action-index"), 10);
    const activity = campActionsData[actionIndex];
    let extraData = {};

    // Fetch the selected skill for aiding
    const selectedSkill = $(event.currentTarget)
      .closest(".cs-dl3-aid-another-container")
      .find(".cs-dl3-aid-skill-select")
      .val();

    if (typeof activity.onUserPerform === "function") {
      // const context = this._getEnrichedActivityContext(activity);
      extraData = await activity.onUserPerform({
        activityActions: this.stateManager.getActivityActions(activity.id),
        isAid: true,
        actorName: this.assignedActor.name,
      });

      if (extraData.isCancel) {
        // During the onUserPerform call, this action was canceled.
        return;
      }
      else {
        delete extraData.isCancel;
      }
    }

    // Use CampActionsState to update the state for aiding
    await this.stateManager.addOrUpdateActivity(
      activity.id,
      selectedSkill,
      { isAid: true, extraData }
    );

    if (game.user.isGM) {
      this.render(true);
    }
  }

  // Event handler: Toggle the details view
  _toggleDetails(event) {
    const activityElem = $(event.currentTarget).closest(".cs-dl3-activity");
    const details = activityElem.find(".cs-dl3-activity-details");
    details.toggleClass("cs-dl3-hidden");

    const toggleIcon = activityElem.find(".cs-dl3-details-toggle i");
    toggleIcon.toggleClass("fa-circle-caret-down");
    toggleIcon.toggleClass("fa-circle-caret-up");
  }
}
