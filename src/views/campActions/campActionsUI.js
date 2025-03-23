// import clsx from "../../node_modules/clsx/index.js";
import { getSkillDisplay } from "../../constants/campActions/index.js";
import { artPath } from "../../constants/paths.js";
import { clsx } from "../../helpers/display.js";
import { generateSkillChoices } from "../../helpers/entityTools.js";
import { getSkillCountsByActivity, verifyActivityHasBeenAidedByActor, verifyActivityHasBeenPerformed } from "./campActionsState.js";

/**
 * Updates the skill options (data attributes) for the activity's element.
 */
export function updateSkillOptionsDisabled(element, activityActions, activity, actor, hasEnoughHoursForActivity) {
  for (const type of ["aid", "perform"]) {
    const isAid = type === "aid";
    const aidTypeString = isAid
      ? "-aid"
      : "";
    const skills = isAid
      ? activity.aidSkills
      : activity.skills;
    const choices = generateSkillChoices(actor, skills, type);
    const hasValidChoices = choices.some(choice => !choice.disabled);
    const selectElement = element.find(`.cs-dl3${aidTypeString}-skill-select`);
    const passesAidCheck = isAid
      ? verifyActivityHasBeenPerformed(activityActions, { ignorePerformer: actor.name })
      : true // set to true to bypass check for perform
    const activityPerformances = activityActions.filter(a => !a.isAid);
    const activityHasBeenPerformedByAnyone = activityPerformances.some(x => x);
    const activityHasBeenPerformedByMe = activityPerformances.some(x => x.performer === actor.name);
    const passesPerformCheck = !isAid
      || (activity.canPerform?.({ activityActions }) ?? false)
      || (activityHasBeenPerformedByMe && !activity.repeatable)
      || (activityHasBeenPerformedByAnyone && !activity.useIndependentTracking);
    const activityCanBeAided = !isAid // autopass if this isn't for an aid
      || (activity.canAid?.({ activityActions, actorName: actor.name }) ?? true) // passes activity specific checks;
    const isDisabled = !hasValidChoices
      || !passesAidCheck
      || !activityCanBeAided
      || !passesPerformCheck
      || !hasEnoughHoursForActivity;

    selectElement.prop("disabled", isDisabled);
  }
}

export const buildGlobalMessage = (activityActions, assignedActor, { isAid = false, includeSkills = true } = {}) => {
  let performedMessage = "";

  const messageStyle = isAid
    ? "Aided"
    : "Performed";

  const groupedPerformers = activityActions
    .filter(a => 
      a.performer !== assignedActor.name
      && a.count > 0
      && a.isAid === isAid
    )
    .reduce((acc, curr) => {
      if (!acc[curr.performer]) {
        acc[curr.performer] = [];
      }

      const existing = acc[curr.performer].find(x => x.skill === curr.skillCode);
      if (existing) {
        existing.count += curr.count;
      }
      else {
        acc[curr.performer].push({ count: curr.count, skill: curr.skillCode });
      }

      return acc;
    }, {});

  const validPerformerMessages = Object.entries(groupedPerformers).map(([performer, skills]) => {
    let msg = performer;

    if (includeSkills) {
      skills.forEach(({ skill, count }) => {
        if (count) {
          msg += ` (${getSkillDisplay(skill)}`;
          msg += count > 1 ? ` x${count})` : ')';
        }
      });
    }
  
    return msg;
  });

  if (validPerformerMessages.length > 0) {
    performedMessage = `<strong>${messageStyle} by:</strong> ${validPerformerMessages.join(", ")}`;
  }

  return performedMessage;
};

export const determineGlobalInfo = (activity, activityActions, assignedActor) => {
  const performedMessage = buildGlobalMessage(activityActions, assignedActor);
  const aidedMessage = buildGlobalMessage(activityActions, assignedActor, { isAid: true });
  const fullMessage = performedMessage && aidedMessage
    ? performedMessage + "<br/>" + aidedMessage
    : performedMessage || aidedMessage;

  return (!activity.useIndependentTracking && !activity.repeatable)
    ? aidedMessage
    : fullMessage;
}

export function updateGlobalInfo(element, activity, activityActions, assignedActor) {
  const globalInfoMessage = determineGlobalInfo(activity, activityActions, assignedActor);
  let aidRow = element.find(".cs-dl3-aid-helpers-row");
  if (!aidRow.length) {
    aidRow = $("<div>", { class: "cs-dl3-aid-helpers-row" });
    $(element).find(".cs-dl3-activity-options").append(aidRow);
  }
  
  if (globalInfoMessage) {
    aidRow.removeClass("cs-dl3-hidden")
      .html(globalInfoMessage);
  } else {
    aidRow.addClass("cs-dl3-hidden")
      .html("");
  }
}

/**
 * Computes the full button state (button text, additional info HTML, and a flag)
 * However, we now use a dedicated computeButtonText() function to extract only the button text.
 */
const defaultPerformButtonText = "Perform Action";
export const determinePerformButtonText = (activity, activityActions, assignedActor) => {
  const performedMessage = buildGlobalMessage(activityActions, assignedActor, { includeSkills: false });
  return (!activity.useIndependentTracking && !activity.repeatable)
    ? performedMessage || defaultPerformButtonText
    : defaultPerformButtonText;
}

/**
 * Updates only the perform button text.
 */
export function updatePerformButton(element, activityActions, activity, assignedActor, hasEnoughHoursForActivity) {
  const performButtonText = determinePerformButtonText(activity, activityActions, assignedActor);
  const isSkillSelectDisabled = $(element).find('.cs-dl3-skill-select').prop('disabled');
  const performButton = $(element).find(".cs-dl3-activity-action");
  performButton.html(performButtonText);
  const activityPerformances = activityActions.filter(a => !a.isAid);
  const activityHasBeenPerformedByAnyone = activityPerformances.some(x => x);
  const activityHasBeenPerformedByMe = activityPerformances.some(x => x.performer === assignedActor.name);
  const activityPerformersCheck = activity.useIndependentTracking
    ? activityHasBeenPerformedByMe
    : activityHasBeenPerformedByAnyone;
  const isDisabled = isSkillSelectDisabled
    || !(activity.canPerform?.({ activityActions }) ?? true)
    || !hasEnoughHoursForActivity
    || (activityPerformersCheck && !activity.repeatable);
  performButton.prop("disabled", isDisabled);
}

export function updateAidButtonState(element, activityActions, activity, actorName, hasEnoughHoursForActivity) {
  const hasAided = verifyActivityHasBeenAidedByActor(activityActions, actorName)
  const hasBeenPerformedBySomeoneElse = verifyActivityHasBeenPerformed(activityActions, { ignorePerformer: actorName });
  const isDisabled = !hasBeenPerformedBySomeoneElse // No one has performed
    || (hasAided && !activity.repeatable) // is not repeatable and has been aided by the actor already
    || (activity.useIndependentTracking && !activity.repeatable) // isIndependant tracking
    || (!(activity.canAid?.({ activityActions, actorName }) ?? true))// passes activity specific checks
    || !hasEnoughHoursForActivity // passed from FormApp
  const performButton = $(element).find(".cs-dl3-aid-another-action");

  performButton.prop("disabled", isDisabled);
}

/**
 * Updates the checkmarks DOM based on completed actions and aids.
 */
export function updateCheckmarks(element, activityActions, activity, actorName) {
  const checkmarkContainer = $(element).find(".cs-dl3-checkmark-container");
  checkmarkContainer.empty();
  let {
    performedByOthers: lockedPerfSkills,
    performedByMe: unlockedPerfSkills,
    aidedByOthers: lockedAidSkills,
    aidedByMe: unlockedAidSkills,
  } = getSkillCountsByActivity(activityActions, actorName);

  // what was the point of this again? it's causing issues and I don't get why we show no checks if this condition
  // if (activity.useIndependentTracking && !activity.repeatable) {
  //   unlockedPerfSkills = 0;
  //   unlockedAidSkills = 0;
  // }

  // const completedCount = completedActions[index] || 0;
  const appendCheckmarks = (actions, { isAid = false, unlocked = false } = {}) => {
    for (const { activityId, skillCode, category } of actions) {
      const extraCheckMarkText = activity.getCheckmarkData?.({ category }) || '';
      const altText = `${isAid ? "Aided" : "Performed"} with ${getSkillDisplay(skillCode)}${extraCheckMarkText}`;
      const className = clsx([
        "cs-dl3-checkmark",
        (isAid && unlocked) && "cs-dl3-aid-checkmark",
        !unlocked && "cs-dl3-disabled-checkmark"
      ]);
  
      checkmarkContainer.append(
        `<div class="${className}">
          <img src="${artPath("checkmark.png")}"
            data-action="${activityId}"
            data-skill="${skillCode}"
            ${isAid ? 'data-aid="true"' : ""}
            ${unlocked ? '' : 'data-locked="true"'}
            title="${altText}"
            alt="Checkbox for ${altText}, click to unselect" 
          >
        </div>`
      );
    }
  };
  
  // Append locked and unlocked performers and helpers
  appendCheckmarks(lockedPerfSkills, { unlocked: false });
  appendCheckmarks(lockedAidSkills, { isAid: true, unlocked: false });
  appendCheckmarks(unlockedPerfSkills, { unlocked: true });
  appendCheckmarks(unlockedAidSkills, { isAid: true, unlocked: true });
}

export const updateRemainingHours = (html, remainingHours) => {
  html.find('.cs-dl3-remaining-hours').text(remainingHours);
}

/**
 * Composite function which updates the UI for a given activity.
 * It calls the helper functions in the correct order.
 */
export async function updateActivityUI(
  element,
  activity,
  activityActions,
  assignedActor,
  hasEnoughHoursForActivity
) {
  // Update skill options.
  updateSkillOptionsDisabled(element, activityActions, activity, assignedActor, hasEnoughHoursForActivity);

  // Update the globalInfo message.
  updateGlobalInfo(element, activity, activityActions, assignedActor);

  // Update the perform/aid button.
  updatePerformButton(element, activityActions, activity, assignedActor, hasEnoughHoursForActivity);
  updateAidButtonState(element, activityActions, activity, assignedActor.name, hasEnoughHoursForActivity);

  // Update checkmarks.
  updateCheckmarks(element, activityActions, activity, assignedActor.name);
}
