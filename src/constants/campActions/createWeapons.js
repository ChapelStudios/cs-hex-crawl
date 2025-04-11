import { getNestedProperty } from "../../helpers/entityTools.js";
import { getCampToken } from "../../repos/gameSettings.js";
import { getProvisions, updateProvisions } from "../../repos/provisions.js";

export const createWeapons = {
  id: "createWeapons",
  title: "Create Weapons",
  timeCost: 4,
  repeatable: false,
  useIndependentTracking: false,
  lockAfterPerform: false,
  details: `
    <p><em>Requires Craft (Weaponsmith) 5 ranks</em></p>
    <p>
      Upon a successful check, DC 15, you craft 5 Make-Shift Weapons (spears). 
      Since these are made of timber, they only count as weapons for 1 round of combat. 
      For every 10 points that this check exceeds the maximum, gain an additional 5 Make-Shift Weapons.
    </p>
  `,
  aidSkills: [
    {
      skill: "crf.subSkills.any",
      display: "Craft (Any)",
      dc: 10,
    },
    {
      skill: "dev",
      display: "Disable Device",
      dc: 15
    },
    {
      skill: "str",
      display: "Strength",
      dc: 10
    },
  ],
  skills: [
    {
      skill: "crf.subSkills.crf2",
      display: "Craft (Weaponsmith)",
      rankRequirement: 5,
      dc: 15,
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: ({ assignedActor, activity }) => {
    const skillBase = "crf.subSkills";
  
    // Retrieve the subskills object using getNestedProperty
    const actorSkills = assignedActor?.system?.skills || {};
    const craftSubSkills = Object.entries(getNestedProperty(actorSkills, skillBase, {}))
      .filter(([_, skill]) => skill.rank >= 1)
      .map(([key, skill]) => ({
        skill: `${skillBase}.${key}`,
        display: `Craft (${skill.name || "Unknown"})`,
        dc: 10
      }));
  
    // Replace "Craft (Any)" in the aidSkills array dynamically
    const aidSkills = activity.aidSkills.flatMap(skill => 
      skill.skill === "crf.subSkills.any" ? craftSubSkills : skill
    );
  
    return {
      aidSkills, // Updated aidSkills data
    };
  },
  resolveBonuses: async ({ checkResult, actionData, baseBonus, scene }) => {
    let msg;
    if (checkResult < actionData.skillDetails.dc) {
      msg = `Was unable to get anything done.`
    }
    else {
      const excessPoints = checkResult - actionData.skillDetails.dc;
      const bonusSpears = (Math.floor(excessPoints / 10) + 1) * 5
      const campToken = getCampToken(scene);
      const existing = getProvisions(campToken);
      await updateProvisions(campToken, {
        makeShiftWeapons: bonusSpears + existing.makeShiftWeapons,
      });

      msg = `Created ${bonusSpears} Bonus Spears.`;
    }
    return Promise.resolve([
      {
        ...baseBonus,
        value: msg,
        wasApplied: true,
      }
    ]);
  },
}