import { factions } from "../../../factions/factionInfo.js";
import { getFactionData } from "../../../factions/factions.js";
import { displayFactionSelector } from "../../../helpers/factionSelector.js";

export const factionCode = {
  setMaxUsesToFactionCount: (bonusUses = 0) => () => {
    const factions = getFactionData(canvas.scene);
    return {
      actionMaxUses: factions.length + bonusUses,
    };
  },
  canAid: (mappingFunction = mapCategoryToFaction) => ({ activityActions, actorName }) => {
    const performedByOthers = listSelectedFactionsForActivity(activityActions, mappingFunction, { ignorePerformer: actorName });
    const alreadyAidedByMe = listSelectedFactionsForActivity(activityActions, mappingFunction, { requiredPerformer: actorName, findAids: true });
    return performedByOthers.some(a => !alreadyAidedByMe.some(c => c.id == a.id));
  },
  canPerform: (mappingFunction = mapCategoryToFaction, bonusOptions = []) => ({ activityActions }) => {
    const allSelectedFactions = listSelectedFactionsForActivity(activityActions, mappingFunction);
    return [
      ...getFactionData(canvas.scene),
      ...bonusOptions,
    ]
      .some(f => !allSelectedFactions.some(sf => sf.id === f.id));
  },
  onUserPerform: (mappingFunction = mapCategoryToFaction, bonusOptions = []) => async ({ activityActions, actorName, isAid = false }) => {
    const allSelectedFactions = listSelectedFactionsForActivity(activityActions, mappingFunction);
    const performFactions = [
      ...getFactionData(canvas.scene),
      ...bonusOptions,
    ]
      .filter(f => !allSelectedFactions.some(sf => sf.id === f.id));
    const performedByOthers = listSelectedFactionsForActivity(activityActions, mappingFunction, { ignorePerformer: actorName });
    const alreadyAidedByMe = listSelectedFactionsForActivity(activityActions, mappingFunction, { requiredPerformer: actorName, findAids: true });
    const aidFactions = performedByOthers.filter(a => !alreadyAidedByMe.some(c => c.id == a.id));
    
    const factionOptions = isAid
      ? aidFactions
      : performFactions

    if (!factionOptions.length) {
      return { isCancel: true };
    }

    const selectedFaction = await displayFactionSelector(factionOptions);

    return {
      category: selectedFaction,
      isCancel: !selectedFaction,
    };
  },
  onUserUnselect: (mappingFunction = mapCategoryToFaction) => async ({ activityActions, actorName, isAid, skillCode }) => {
    const selectedFactions = listSelectedFactionsForActivity(activityActions, mappingFunction, { requiredPerformer: actorName, findAids: isAid, requiredSkillCode: skillCode });
    if (selectedFactions.length === 1) {
      return {
        category: selectedFactions[0].id,
      };
    }
    
    const selectedFaction = await displayFactionSelector(selectedFactions);

    return {
      category: selectedFaction,
      isCancel: !selectedFaction,
    };
  },
  getCheckmarkData: () => ({ category }) => {
    return category
      ? ` for ${category}`
      : '';
  },
};

export const mapCategoryToFaction = (factionId) => {
  return {
    id: factionId,
    name: factions[factionId],
  };
};

export const listSelectedFactionsForActivity = (
  activityActions,
  mapFunction,
  {
    requiredPerformer = null,
    ignorePerformer = null,
    findAids = false,
    requiredSkillCode = null
  } = {}
) => {
  return [...new Set(
    activityActions
      .filter(a => 
        a.count > 0
        && (requiredPerformer ? a.performer === requiredPerformer : true)
        && (ignorePerformer ? a.performer !== ignorePerformer : true)
        && (requiredSkillCode ? a.skillCode === requiredSkillCode : true)
        && a.isAid == findAids
      ).map(c => c.category)
  )].map(t => mapFunction(t));
};