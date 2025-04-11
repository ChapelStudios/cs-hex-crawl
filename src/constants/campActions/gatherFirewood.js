import { bonusTypes } from "./checkOnFaction.js";
import { factionCode, mapCategoryToFaction } from "./common/factions.js";

const cookOption = {
  id: "cook",
  name: "Cook Fires",
};

const mapCategoryToFactionOrCooking = (category) => {
  return category === cookOption.id
    ? cookOption
    : mapCategoryToFaction(category);
};

export const gatherFirewood = {
  title: "Gather Firewood",
  id: "gatherFirewood",
  timeCost: 1,
  repeatable: true,
  useIndependentTracking: true,
  actionMaxUses: 1, // this is overridden in getSelectionData
  details: `
    <p>
      You assist with gathering firewood for the night. Upon a successful DC 10 Strength or 8 Survival check, 
      you're able to grab enough wood to bolster one faction's supply for the day, improving your standing with that faction. 
      You can also choose to give it to the cooking fires to give a +5 bonus to a Cook activity.
    </p>
    <p><em>All players perform this task by themselves with separate checks.</em></p>
  `,
  aidSkills: [],
  skills: [
    {
      skill: "str",
      display: "Strength",
      rankRequirement: 5,
      dc: 10,
    },
    {
      skill: "sur",
      display: "Survival",
      rankRequirement: 1,
      dc: 8,
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: factionCode.setMaxUsesToFactionCount(1),
  canAid: factionCode.canAid(mapCategoryToFactionOrCooking),
  canPerform: factionCode.canPerform(mapCategoryToFactionOrCooking, [cookOption]),
  onUserPerform: factionCode.onUserPerform(mapCategoryToFactionOrCooking, [cookOption]),
  onUserUnselect: factionCode.onUserUnselect(mapCategoryToFactionOrCooking),
  getCheckmarkData: factionCode.getCheckmarkData(),
  resolveBonuses: async ({ checkResult, actionData, baseBonus }) => {
    if (checkResult < actionData.skillDetails.dc) {
      return Promise.resolve([{
        ...baseBonus,
        value: `${actionData.skillDetails.display} check of ${checkResult} failed to beat the DC of ${actionData.skillDetails.dc}`,
        wasApplied: true,
      }]);
    }

    const result = actionData.category === cookOption.id
      ? [{
        ...baseBonus,
        type: bonusTypes.cookingBonus,
        value: 5,
      }]
      : [{
        ...baseBonus,
        type: bonusTypes.factionReputationAdjust,
        value: 10,
      }, {
        ...baseBonus,
        type: bonusTypes.factionWasContacted,
        value: true,
      }];

    return Promise.resolve(result);
  },
};