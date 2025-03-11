import { hexTokenTypes } from "../constants/moveCosts.js";
import { getFactionPopulationTotals } from "../factions/factions.js";
import { requestSkillCheckActionName } from "../helpers/entityTools.js";
import { updateActor, updateScene, updateToken } from "../helpers/update.js";
import { executeForActorsAsync } from "../socket.js";

// Shortcut til 12 where there is an actual CONST declared eg CONST.ENTITY_PERMISSIONS.OWNER;
const OWNER_PERMISSION = 3;
const LIMITED_PERMISSION = 1;
const DEFAULT_PERMISSION = 0;

const defaultGroupConfig = Object.freeze({
  partyMembers: [],
  refugees: 0,
  infirm: 0,
  warriors: 0,
  foragers: 0,
});

// move hover state
export const isMoveHoverStateActive = () => game.user.flags.hexCrawl?.isMoveHoverState ?? false;
export const setMoveHoverState = async (newState) => await game.user.update({
  ['flags.hexCrawl.isMoveHoverState']: newState,
});

export const flipMoveHoverState = async (scene) => {
  await setMoveHoverState(!isMoveHoverStateActive());
};

// init
export const hasCompletedHexCrawlInit = (scene) => scene?.flags.hexCrawl?.isInitComplete ?? false;
export const completeHexCrawlInit = async (scene) => await updateScene(scene, {
  ['flags.hexCrawl.isInitComplete']: true,
});

// Group Config
export const initGroupConfig = async (scene, groupInitSettins) => {
  const tokens = getHexCrawlTokens(scene);
  const jobs = tokens.map(t => {
    const newGroupConfig = !!groupInitSettins[t.id]
      ? groupInitSettins[t.id]
      : defaultGroupConfig;
    return setPartyConfig(t, newGroupConfig);
  });
  await Promise.all(jobs);
};

export const getPartyConfig = (token) => {
  const config = token?.flags.hexCrawl?.groupConfig || defaultGroupConfig;
  return {
    ...config,
    total: getGroupPopulationTotal(config),
  };
};

export const getPartyCarryLoads = (token) => {
  const config = getPartyConfig(token);
  const normalLoad = config.total * 30
  return {
    normalLoad,
    heavyLoad: normalLoad * 2,
  };
};

export const getTokenPartyMembers = (token) => getPartyConfig(token).partyMembers;

export const isActorInParty = (actor, token) => {
  if (!actor) return false; // Skip if actor is not found

  const tokenPartyMemebers = getTokenPartyMembers(token);
  
  // Iterate over the token IDs and check ownership
  return tokenPartyMemebers.some(tokenId => {
    return tokenId === actor.id; // Check if token's actor matches the user's actor
  });  
}

export const setPartyConfig = async (token, groupConfig) => await updateToken(token, {
  ['flags.hexCrawl.groupConfig']: {
    id: token.id,
    name: token.name,
    ...groupConfig,
  },
});

export const getCampConfig = (scene, token) => ({
  ...getPartyConfig(token),
  ...getFactionPopulationTotals(scene),
  id: token.id,
  name: token.name,
});

const combineConfigs = (config1, config2) => {
  const combined = {};

  Object.keys(config1).forEach(key => {
    if (typeof config1[key] === 'number') {
      combined[key] = config1[key] + (config2[key] || 0);
    }
  });

  Object.keys(config2).forEach(key => {
    if (!(key in combined) && typeof config2[key] === 'number') {
      combined[key] = config2[key];
    }
  });

  return combined;
}

export const getPopulationTotals = (scene) => {
  const campConfig = getCampConfig(scene, getCampToken(scene));
  const partyTokens = getPartyTokens(scene);

  let combinedConfig = { ...campConfig };

  partyTokens.forEach(token => {
    const partyConfig = getPartyConfig(token);
    combinedConfig = combineConfigs(combinedConfig, partyConfig);
  });

  return combinedConfig;
};

export const getIndexedParties = (tokens) => tokens.reduce((result, nextToken) => {
  result[nextToken.id] = getPartyConfig(nextToken);
  return result;
}, {});

export const setGroupTokenOwner = async (tokenId, actorIds) => {
  const actor = canvas.tokens.get(tokenId)?.document?.actor;

  if (!actor) {
    ui.notifications.error(`Token with ID ${tokenId} not found.`);
    return;
  }

  // Retrieve existing permissions to preserve the default setting
  const existingPermissions = actor.ownership;
  const newPermissions = {};

  // Add incoming actor IDs as owners
  for (const actorId of actorIds) {
    const actorOwners = game.actors.get(actorId)?.ownership;
    const actor = game.actors.get(actorId);

    if (!actorOwners || Object.keys(actorOwners).length === 0) {
      ui.notifications.warn(`No owners found for actor with ID ${actorId}.`);
      continue;
    }

    for (const userId in actorOwners) {
      if (userId !== "default" && actorOwners[userId] === OWNER_PERMISSION) {
        newPermissions[userId] = OWNER_PERMISSION;
      }
    }
  }

  // Ensure GM permissions are included
  for (const user of game.users) {
    if (user.isGM) {
      newPermissions[user.id] = OWNER_PERMISSION;
    }
  }

  // Preserve the default permission if it exists
  if ("default" in existingPermissions) {
    newPermissions["default"] = existingPermissions["default"];
  }

  // Set limited permissions (1) for all other users
  for (const user of game.users) {
    if (!newPermissions[user.id] && !user.isGM) {
      newPermissions[user.id] = DEFAULT_PERMISSION;
    }
  }

  // Update the actor's ownership
  await updateActor(actor, { ownership: newPermissions }, { diff: false });
};

export const getGroupPopulationTotal = (groupConfig) => Object.values(groupConfig)
  .reduce((total, next) => {
    if (typeof next === 'number') {
      total += next;
    }
    return total;
  }, 0);

// Get Tokens
export const getHexCrawlTokens = (scene) => scene?.tokens
  .filter(token => isHexCrawlToken(token)) || [];
export const getPartyTokens = scene => scene?.tokens
  .filter(t => isPartyToken(t)) || [];
export const getCampToken = scene => scene?.tokens
  .find(t => isCampToken(t));

export const isHexCrawlToken = (token) => isCampToken(token) || isPartyToken(token);
export const isPartyToken = (token) => token?.flags.hexCrawl?.isParty ?? false;
export const isCampToken = (token) => token?.flags.hexCrawl?.isCamp ?? false;
export const getTokenType = token => {
  if (isCampToken(token)) return hexTokenTypes.camp;
  else if (isPartyToken(token)) return hexTokenTypes.party;
  return null;
}

export const getPartyMemberList = () => {
  return game.actors.filter(actor => actor.system.isPartyMember);
};

export const getFirstOwnedPartyMember = () => {
  const partyMembers = getPartyMemberList();
  return partyMembers.find(actor => actor.hasPlayerOwner);
};

// Function to get the first token with the owned party member's id
export const getFirstTokenWithPartyMember = (scene) => {
  const firstPartyMember = getFirstOwnedPartyMember();
  if (!firstPartyMember) return null;

  const tokens = getHexCrawlTokens(scene);
  return tokens.find(token => getCampConfig(scene, token).partyMembers.includes(firstPartyMember.id));
};

export const getFirstSelectedToken = () => {
  const selectedTokens = canvas.tokens.controlled;
  return selectedTokens
    ? selectedTokens.find(token => isHexCrawlToken(token.document))
    : null;
};

export const getTokenByUser = (scene) => game.user.isGM
  ? getFirstSelectedToken()
  : getFirstOwnedPartyMember(scene);

export const confirmTokenDelete = async (token) => new Promise((resolve) => {
  let d = new Dialog({
    title: "Confirm Deletion",
    content: `<p>Are you sure you want to delete the token <strong>${token.name}</strong>?</p>`,
    buttons: {
      yes: {
        label: "Yes",
        callback: () => {
          resolve(true); // Proceed with deletion
        }
      },
      no: {
        label: "No",
        callback: () => {
          resolve(false); // Cancel deletion
        }
      }
    },
    default: "no", // Default to "No" if the dialog is closed
    close: () => {
      resolve(false); // Cancel deletion by default
    }
  });

  d.render(true); // Render the dialog
});

// Camp Actions
export const refreshCampActionsHandlerName = "refreshCampActions";
export const campActionsAppId = "cs-hex-camp-actions-app";

export const refreshCampActions = async () => {
  for (const app of Object.values(ui.windows)) {
    // Check if the app matches the campActionsAppId
    if (app.id === campActionsAppId) {
      // Fetch the latest state from the token
      const scene = app.object; // the app's object is the scene
      const globalCompletedActions = getCurrentCampActions(scene);

      // Update the app's local state and UI
      app.globalCompletedActions = globalCompletedActions;
      app.updateUI(app.element); // Call the app's update method with its HTML
      return;
    }
  }
};

function combineUserActions(existingActions, newActions) {
  const mergedResults = { ...existingActions };

  // Ensure days exist in the merged results
  mergedResults[newActions.day] = mergedResults[newActions.day] || [];

  // Iterate through new activities
  newActions.selectedActivities.forEach(newActivity => {
    // Find an existing activity with the same title
    const existingActivity = mergedResults[newActions.day].find(
      activity => activity.activityTitle === newActivity.title
    );

    if (existingActivity) {
      // Merge performers for each skill
      newActivity.skill?.forEach(selectedSkill => {
        const performerExists = existingActivity.performers.some(
          performer =>
            performer.actorId === newActions.id &&
            performer.skill === selectedSkill.skill
        );

        if (!performerExists) {
          existingActivity.performers.push({
            name: newActions.name,
            actorId: newActions.id,
            skill: selectedSkill.skill,
            skillDisplay: selectedSkill.display,
          });
        }
      });

      // Merge aides
      if (newActivity.aidSkillUsed) {
        const aidExists = existingActivity.aides.some(
          aide =>
            aide.actorId === newActions.id &&
            aide.skill === newActivity.aidSkillUsed.skill
        );

        if (!aidExists) {
          existingActivity.aides.push({
            name: newActions.name,
            actorId: newActions.id,
            skill: newActivity.aidSkillUsed.skill,
            dc: newActivity.aidSkillUsed.dc,
            skillDisplay: newActivity.aidSkillUsed.display,
          });
        }
      }

      // Update timesPerformed
      existingActivity.timesPerformed += newActivity.timesPerformed;
    } else {
      // If the activity doesn't exist, add it to the day
      mergedResults[newActions.day].push({
        id: newActivity.id,
        activityTitle: newActivity.title,
        timesPerformed: newActivity.timesPerformed,
        skills: newActivity.skills?.map(skill => ({
          skill: skill.skill,
          display: skill.display,
        })),
        performers: newActivity.skills?.map(selectedSkill => ({
          name: newActions.name,
          actorId: newActions.id,
          skill: selectedSkill.skill,
          skillDisplay: selectedSkill.display,
        })) || [],
        aides: newActivity.aidSkillUsed
          ? [
              {
                name: newActions.name,
                actorId: newActions.id,
                skill: newActivity.aidSkillUsed.skill,
                dc: newActivity.aidSkillUsed.dc,
                skillDisplay: newActivity.aidSkillUsed.display,
              },
            ]
          : [],
      });
    }
  });

  return mergedResults;
}

export const getUserActionsForDay = (scene, day) => {
  if (!day) {
    console.error("getUserActionsForDay called without a valid day");
    return [];
  }

  const actions = scene?.flags.hexCrawl?.campActionsResults || {};

  return actions[day] || [];
};

export const getAllUserActions = (scene) => scene?.flags.hexCrawl?.campActionsResults || {};

export const getCurrentCampActions = (scene) => getCampToken(scene)?.flags.hexCrawl?.currentCampActions || {};
export const updateCurrentCampActions = async (scene, newActions) => await updateToken(getCampToken(scene), { 'flags.hexCrawl.currentCampActions': newActions });

export const saveActionsRequestActionName = 'saveActionsRequest';
const saveActionsRequest = async (scene, newActions) => {
  const existingActions = getUserActionsForDay(scene);
  const totalActions = combineUserActions(existingActions, newActions);
  await updateScene(scene, {
    "flags.hexCrawl.campActionsResults": totalActions
  });
};

export const settingsSocketConfig = (socket) => {
  socket.register(
    saveActionsRequestActionName,
    saveActionsRequest,
  );
  socket.register(
    refreshCampActionsHandlerName,
    refreshCampActions,
  );
};

export const processActionRolls = async (actionData, baseActivity) => {
  // Batch process performer rolls
  const performerResults = await executeForActorsAsync(
    requestSkillCheckActionName,
    (actionData.performers || []).map((performer) => performer.actorId), // Use actor IDs directly
    baseActivity.skill // Common skill for all performers
  );

  // Process aide rolls individually
  const aidePromises = (actionData.aides || []).map(async (aide) => {
    const rollResult = await executeForActorsAsync(
      requestSkillCheckActionName,
      [aide.actorId], // Single actor ID as array
      aide.skill // Skill specific to the aide
    );
    return { name: aide.name, rollResult: rollResult[aide.actorId], dc: aide.dc };
  });

  const aideResults = await Promise.all(aidePromises);

  // Combine results into a single object
  return {
    performers: Object.entries(performerResults).map(([actorId, rollResult]) => ({
      name: game.actors.get(actorId)?.name, // Retrieve the name for readability
      rollResult,
    })),
    aides: aideResults,
  };
};

