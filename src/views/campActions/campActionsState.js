import { campActionsData } from "../../constants/campActions/index.js";
import { getCurrentCampActions, refreshCampActionsHandlerName, updateCurrentCampActions } from "../../repos/gameSettings.js";
import { getProvisions } from "../../repos/provisions.js";
import { dl3HexCrawlSocket } from "../../socket.js";

// campActionsState.js
const defaultState = {
  activities: [],
  hours: {},
//   currentDay: 0,
};

const getDefaultState = () => {
  return foundry.utils.deepClone(defaultState);
}

export class CampActionsState {
  constructor(scene, owner, pushUpdate, currentDay) {
    // Load existing state if not provided
    this.state = {
      ...getDefaultState(),
      ...getCurrentCampActions(scene),
    };
    this.scene = scene;
    this.owner = owner;
    this.performUiUpdate = pushUpdate;
    this.currentDay = currentDay;
  }

  getEnrichedActivityData(activityId) {
    const activity = campActionsData.find(a => a.id === activityId);

    if (!activity) {
      throw new Error(`Activity with ID ${activityId} not found`);
    }

    const context = {
      activity,
      provisions: getProvisions(this.owner),
      assignedActor: this.owner,
    };

    return {
      ...activity,
      ...(activity.getEnrichedData?.(context) || {}),
    };
  }

  getState() {
    if (!this.state || Object.keys(this.state).length === 0) {
      this.state = {
        ...getDefaultState(),
      };
    }

    return this.state;
  }

  getActivitiesState(day = this.currentDay) {
    return this.getState().activities
      .filter(a => a.currentDay === day);
  }

  _addToActivities(activity) {
    this.getState().activities.push(activity);
  }

  getHoursState() {
    return this.getState().hours;
  }
  
  getActionsByPerformer(performer = this.owner?.name) {
    return this.getActivitiesState().filter(a => 
      a.performer === performer
    );
  }

  lockActivitiesForPerformer(performer = this.owner?.name) {
    this.getActivitiesState().forEach(action => {
      if (action.performer === performer && !action.isLocked) {
        action.isLocked = true;
      }
    });
  }

  getActivityTimeCost(activityId) {
    return this.getEnrichedActivityData(activityId)?.timeCost ?? 0;
  }

  modifyHoursForPerformer(performer, activityId, isIncrement = false) {
    const timeCost = this.getActivityTimeCost(activityId);
    const hoursCost = isIncrement
      ? timeCost
      : timeCost * -1;

    const hoursState = this.getHoursState();
    hoursState[performer] = Math.max(0, (hoursState[performer] ?? 0) + hoursCost);
  }

  _removeRelatedAidsIfNeeded(activityId, category) {
    const actions = this.getActivitiesState();
    const hasMatchingPerformances = actions.some(a =>
      a.activityId === activityId
      && a.category === category
      && !a.isAid
    );

    if (hasMatchingPerformances) {
      return;
    }
  
    // If no matching performances, remove related aids and refund associated costs
    if (!hasMatchingPerformances.length)
    actions
      .filter(action =>
        action.activityId === activityId
        && action.category === category
        && action.isAid
        && action.count > 0
      )
      .forEach(aid => {
        // Update hours for each aid before deletion
        for (let a = 0; a < aid.count; a++) {
          this.modifyHoursForPerformer(aid.performer, aid.activityId, true);
        }
        aid.count = 0; // Reset aid count
      });
  }
  
  _removeActionAndUpdateHours(performer, action) {
    const activities = this.getActivitiesState();
    const index = activities.findIndex(a => a === action)
    if (index > -1) {
      activities.splice(index, 1);
    }

    // Update performer's hours
    this.modifyHoursForPerformer(performer, action.activityId, true);

    // If it's not an aid, remove related aids
    if (!action.isAid) {
      this._removeRelatedAidsIfNeeded(action.activityId, action.category);
    }
  }

  async addOrUpdateActivity(
    activityId,
    skillCode,
    {
      isAid = false,
      isDecrement = false,
      locked = false,
      suppressUpdate = false,
      performer = this.owner,
      extraData: { category, ...extraData} = {}
    } = {} // options
  ) {    
    const changeValue = isDecrement ? -1 : 1;
    const actions = this.getActivitiesState();
    const existing = actions.find(a =>
      a.activityId === activityId
      && a.performer === performer.name
      && a.category === category
      && a.skillCode === skillCode
      && a.isAid === isAid
    )

    if (!existing && isDecrement) {
      return;
    }

    if (existing) {
      existing.isLocked = locked;
      existing.count += changeValue;
      existing.extraData = mergeObject(existing.extraData || {}, extraData);
    }

    const workingRow = existing ?? {
      activityId,
      performer: performer.name,
      performerId: performer.id,
      skillCode,
      category: category ?? null,
      isLocked: locked,
      isAid,
      count: 1,
      extraData,
      currentDay: this.currentDay,
    }

    if (!existing) {
      this._addToActivities(workingRow);
    }

    // if this was the last performance, see if there are any matching ones
    if (!isAid && workingRow.count === 0) {
      this._removeRelatedAidsIfNeeded(activityId, category);
    }

    this.modifyHoursForPerformer(performer.name, activityId, !isDecrement);
  
    await this._saveStateToScene({ performUpdate: !suppressUpdate });
  }

  // When closing, we need to clear out the current actor's unlocked entries.
  async deleteUnlockedRowsForActor(performer = this.owner?.name) {
    const actions = this.getActivitiesState()
      .filter(a => a.performer === performer && !a.isLocked);
    
    for (const action of actions) {
      this._removeActionAndUpdateHours(performer, action);
    }

    this.recalculateHoursForPerformer(performer);
    // Save the updated state
    await this._saveStateToScene();
  }

  refreshStateFromScene() {
    this.state = {
      ...getDefaultState(),
      ...getCurrentCampActions(this.scene),
    };
    
    this.performUiUpdate();
  }

  resetState() {
    this.state = getDefaultState();
    this._saveStateToScene();
  }

  async _saveStateToScene({ pushToOtherPlayers = true, performUpdate: updateUI = true} = {}) {
    if (pushToOtherPlayers) {
      await updateCurrentCampActions(this.scene, this.getState());
      dl3HexCrawlSocket.executeForOthers(refreshCampActionsHandlerName);
    }
    
    if (updateUI) {
      this.performUiUpdate();
    }
  }

  getHoursForPerformer(performer = this.owner?.name) {
    return this.getHoursState()[performer]
      ?? this.recalculateHoursForPerformer(performer);
  }

  verifyActivityHasBeenPerformed(activityId, category, ignorePerformer = null) {
    const activities = this.getActivitiesState();
    
    return activities.some(a =>
      a.activityId === activityId
      && a.category === category
      && a.count > 0
      && !a.isAid
      && (ignorePerformer ? a.performer !== ignorePerformer : true)
    );
  }

  // Pass this to the UI Manager
  getActivityActions(activityId) {
    return this.getActivitiesState()
      .filter(a => a.activityId === activityId)
      .map(c => foundry.utils.deepClone(c));
  }

  recalculateHoursForPerformer(performer = this.owner?.name) {
    const actions = this.getActionsByPerformer(performer);
    const usedHours = actions.reduce((total, action) => {
      if (action.count > 0) {
        const timeCost = this.getActivityTimeCost(action.activityId);
        total += (timeCost * action.count);
      }
    }, 0);
    this.getHoursState()[performer] = usedHours;
    return usedHours;
  }
}

export const verifyActivityHasBeenPerformed = (activityActions, { category = "*", ignorePerformer = null } = {}) => {
  return activityActions.some(a => !a.isAid
    && (category === "*" ? true : a.category === category)
    && a.count > 0
    && (ignorePerformer ? a.performer !== ignorePerformer : true)
  );
}

export const verifyActivityHasBeenAidedByActor = (activityActions, performer, { category = null } = {}) => {
  return activityActions.some(a => a.category === category
    && a.count > 0
    && a.isAid
    && a.performer === performer
  );
}

export const getSkillCountsByActivity = (activityActions, performer, { category = null } = {}) => {
  const filterActivities = ({ isAid, samePerformer }) =>
    activityActions.filter(a => a.count > 0
      // && a.category === category
      && a.isAid === isAid
      && (samePerformer ? a.performer === performer : a.performer !== performer)
    );

  return {
    performedByMe: filterActivities({
      isAid: false,
      samePerformer: true,
    }),
    aidedByMe: filterActivities({
      isAid: true,
      samePerformer: true,
    }),
    performedByOthers: filterActivities({
      isAid: false,
      samePerformer: false,
    }),
    aidedByOthers: filterActivities({
      isAid: true,
      samePerformer: false,
    }),
  };
}

export const UiActions = {
  verifyActivityHasBeenPerformed,
  verifyActivityHasBeenAidedByActor,
  getSkillCountsByActivity,
};


// const exampleRow = {
//   activityId: "",
//   performer: "",
//   performerId: ""
//   skillCode: "",
//   category: "",
//   isLocked: false,
//   isAid: false,
//   count: 0,
//   extraData: {},
//   currentDay: 1
// }

