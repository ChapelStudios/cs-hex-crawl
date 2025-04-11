import { bonusTypes } from "./checkOnFaction.js";

export const improveMedicine = {
  id: "improveMedicine",
  title: "Improve Medicine",
  timeCost: 4,
  repeatable: false,
  useIndependentTracking: false,
  details: `
    <p><em>Requires Craft (Alchemy) 5 ranks or Heal 10 ranks</em></p>
    <p>
      Upon a successful check, DC 15 or 20 depending on the skill used, Infirm only require 1/2 as much medicine 
      (rounded down) during the next upkeep phase to gain its benefit. 
      For every 10 points that this check exceeds the maximum, the benefit lasts for an additional day.
    </p>
  `,
  aidSkills: [
    {
      skill: "crf.subSkills.crf4",
      display: "Craft (Alchemy)",
      dc: 10
    },
    {
      skill: "dev",
      display: "Disable Device",
      dc: 15
    },
    {
      skill: "hea",
      display: "Heal",
      dc: 15
    }
  ],
  skills: [
    {
      skill: "crf.subSkills.crf4",
      display: "Craft (Alchemy)",
      rankRequirement: 5,
      dc: 15,
    },
    {
      skill: "hea",
      display: "Heal",
      rankRequirement: 5,
      dc: 20,
    }
  ],
  getGmData: function(context) {
    const { provisions, performers } = context;

    const hasPerformers = performers && performers.length > 0;
    const noMedicine = !provisions.medicine || provisions.medicine <= 0;

    // Return error message if conditions aren't met
    if (hasPerformers && noMedicine) {
      return {
        errorMessage: "The camp has no medicine but people are trying to perform Improve Medicine"
      };
    }

    return {};
  },
  getEnrichedData: function({ provisions }) {
    const noMedicine = !provisions.medicine || provisions.medicine <= 0;

    // Return error message if conditions aren't met
    if (noMedicine) {
      return {
        errorMessage: "The camp has no medicine with which to perform Improve Medicine",
      };
    }

    return {};
  },
  resolveBonuses: async ({ checkResult, actionData, baseBonus }) => {
    if (checkResult < actionData.skillDetails.dc) {
      return Promise.resolve([{
        ...baseBonus,
        value: `${actionData.skillDetails.display} check of ${checkResult} failed to beat the DC of ${actionData.skillDetails.dc}`,
        wasApplied: true,
      }]);
    }
    const excessPoints = checkResult - actionData.skillDetails.dc;
    const value = (Math.floor(excessPoints / 10) + 1)
    return Promise.resolve([{
      ...baseBonus,
      type: bonusTypes.medicineBoost,
      value,
    }]);
  },
};