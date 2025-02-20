import { hexTokenTypes } from "../constants/moveCosts.js";
import { getFactionPopulationTotals } from "../factions/factions.js";

// Shortcut tile 12 where there is an actual CONST declared
const OWNER_PERMISSION = 3;

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
export const completeHexCrawlInit = async (scene) => await scene?.update({
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

export const setPartyConfig = async (token, groupConfig) => await token?.update({
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

  const newPermissions = {};

  for (const actorId of actorIds) {
    const actorOwners = game.actors.get(actorId)?.ownership;

    if (!actorOwners || Object.keys(actorOwners).length === 0) {
      ui.notifications.warn(`No owners found for actor with ID ${actorId}.`);
      return;
    }

    for (const userId in actorOwners) {
      // Only set the user as the owner if they have the "OWNER" permission
      if (userId !== "default" && actorOwners[userId] === OWNER_PERMISSION) {
        newPermissions[userId] = OWNER_PERMISSION;
      }
    }

    await actor.update({
      ownership: newPermissions,
    });
  }
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