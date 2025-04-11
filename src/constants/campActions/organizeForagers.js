import { bonusTypes } from "./checkOnFaction.js";

export const organizeForagers = {
  title: "Organize the Foragers",
  id: "organizeForagers",
  timeCost: 4,
  repeatable: false,
  useIndependentTracking: false,
  details: `
    <p><em>Requires Survival 5 ranks</em></p>
    <p>
      Players can attempt to help organize the camp's nightly foraging party by successfully making a DC 10 Survival check. 
      Successful checks add a +2 bonus to the camp's nightly Forage action. This bonus is increased by +2 for every 5 points by which the check beats the DC.
    </p>
  `,
  aidSkills: [
    {
      skill: "lis",
      display: "Listen",
      dc: 10
    },
    {
      skill: "spt",
      display: "Spot",
      dc: 10
    },
    {
      skill: "sur",
      display: "Survival",
      dc: 10
    }
  ],
  skills: [
    {
      skill: "sur",
      display: "Survival",
      rankRequirement: 5,
      dc: 10,
    },
  ],
  resolveBonuses: async ({ checkResult, actionData, baseBonus }) => {
    if (checkResult < actionData.skillDetails.dc) {
      const msg = `${actionData.skillDetails.display} check of ${checkResult} failed to beat the DC of ${actionData.skillDetails.dc}`;
      return Promise.resolve([{
        ...baseBonus,
        value: msg,
        wasApplied: true,
      }]);
    }
    else {
      const excessPoints = checkResult - actionData.skillDetails.dc;
      const extraBonus = (Math.floor(excessPoints / 5) + 1) * 2;
      return Promise.resolve([{
        ...baseBonus,
        type: bonusTypes.nightlyForageBoost,
        value: extraBonus,
      }]);
    }
  },
};