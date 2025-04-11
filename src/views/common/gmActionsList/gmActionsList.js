import { getActivityById } from "../../../constants/campActions/index.js";
import { moduleCodePath } from "../../../constants/paths.js";
import { registerPartial } from "../../../helpers/display.js";
import { getSelectOptionFromSkill, skillTypes } from "../../../helpers/entityTools.js";

const _prepareGmActionVm = (action, actorId) => {
  const activity = getActivityById(action.activityId);
  const actionType = action.isAid ? skillTypes.aid : skillTypes.perform;
  const skill = action.isAid
    ? activity.aidSkills.find(skill => skill.skill === action.skillCode)
    : activity.skills.find(skill => skill.skill === action.skillCode);
  const actor = game.actors.get(actorId);
  const skillDisplay = getSelectOptionFromSkill(actor, skill, actionType);

  const extraDataJson = JSON.stringify(action.extraData || {});
  const extraDataString = extraDataJson === '{}' ? null : extraDataJson;
  const timeCost = action.costOverride ?? activity.timeCost ?? 0;

  return {
    ...action,
    activityName: activity.title,
    skillName: skillDisplay.label ?? action.skillCode,
    extraDataString,
    timeCost: timeCost * action.count,
  };
}

export const createGmActionVms = (actions, actorId) => {
  return actions.map(action => _prepareGmActionVm(action, actorId));
}

let isPartialLoaded = false;

export const loadGmActionList = async () => {
  if (isPartialLoaded) return;

  const path = `${moduleCodePath}views/common/gmActionsList/gmActionsList.hbs`;
  const gmActionsList = "gmActionsList";

  await registerPartial(path, gmActionsList);

  isPartialLoaded = true;
}
