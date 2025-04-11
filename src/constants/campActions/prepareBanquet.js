import { getCampToken } from "../../repos/gameSettings.js";
import { getProvisions } from "../../repos/provisions.js";
import { bonusTypes } from "./checkOnFaction.js";

export const prepareBanquet = {
  title: "Prepare Banquet",
  id: "prepareBanquet",
  timeCost: 2,
  repeatable: false,
  useIndependentTracking: false,
  details: `
    <p><em>Requires Profession (Cooking) 1 rank</em></p>
    <p>
      Upon a successful check, DC 15, spices consumed during Upkeep that night provide 2 bonuses instead of 1. 
      If there are no spices, this grants a chance for a bonus equal to the total of the roll.
    </p>
  `,
  aidSkills: [
    {
      skill: "sur",
      display: "Survival",
      dc: 10
    },
    {
      skill: "crf.subSkills.crf4",
      display: "Craft (Alchemy)",
      dc: 10
    },
    {
      skill: "crf.subSkills.crf1",
      display: "Craft (Cooking)",
      dc: 10
    },
    {
      skill: "pro.subSkills.pro1",
      display: "Profession (Cook)",
      dc: 10
    },
    {
      skill: "dex",
      display: "Dexterity",
      dc: 15
    }
  ],
  skills: [
    {
      skill: "crf.subSkills.crf1",
      display: "Craft (Cooking)",
      rankRequirement: 1,
      dc: 15,
    },
    {
      skill: "pro.subSkills.pro1",
      display: "Profession (Cook)",
      rankRequirement: 1,
      dc: 15,
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: (context) => ({}),
  resolveBonuses: async ({ checkResult, actionData, baseBonus, bonuses, scene }) => {
    if (checkResult < actionData.skillDetails.dc) {
      return Promise.resolve([{
        ...baseBonus,
        value: `${actionData.skillDetails.display} check of ${checkResult} failed to beat the DC of ${actionData.skillDetails.dc}`,
        wasApplied: true,
      }]);
    }

    const fireWoodBonus = bonuses.filter(b => 
      b.type === bonusTypes.cookingBonus
      && !b.wasApplied
    ).reduce((total, bonus) => {
      bonus.wasApplied = true;
      return total + (bonus.value ?? 0)
    }, 0);

    checkResult += fireWoodBonus;

    const bonus = {
      ...baseBonus,
      type: bonusTypes.spiceBoost,
    }
    const campToken = getCampToken(scene);
    const existing = getProvisions(campToken);
    if (existing.spices) {
      bonus.value = true;
    }
    else {
      bonus.value = checkResult;
    }

    return Promise.resolve([bonus]);
  }
}