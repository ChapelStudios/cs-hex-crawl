import { calculateSpellMaxUses } from "../../helpers/entityTools.js";
import { bonusTypes } from "./checkOnFaction.js";
import { getManualResult } from "./common/getManualResult.js";

export const performMiracles = {
  title: "Perform Miracles",
  id: "performMiracles",
  timeCost: 1,
  repeatable: true,
  useIndependentTracking: false, // While actually true, we want the repeatable functionality and only one of these should be true
  details: `
    <p>
      Players with access to healing magicks can use them to guarantee that Infirm will recover at the end of the day.
      1 Infirm will recover for each 5 points of healing performed, rounded down.
    </p>
    <p><em>All players perform this task independently with their own spells or abilities.</em></p>
  `,
  aidSkills: [],
  skills: [
    {
      skill: "divine",
      display: "Healing Spell",
      rankRequirement: 1, // Spell level requirement
      maxUses: 1, // Default value; will be overridden by getSelectionData
      dc: "N/A",
    },
    {
      skill: "itemName",
      display: "Lay on Hands",
      rankRequirement: "Lay on Hands",
      maxUses: 1,
      dc: "N/A",
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: ({ assignedActor, activity }) => {
    // For spell-based skills (divine/arcane), override maxUses with the sum of available uses.
    const updatedSkills = activity.skills.map((skill) => {
      if (skill.skill === "divine") {
        // Calculate total available uses for the spellcasting type.
        // Here, we pass in includeHigherLevels = true so that spells at the specified level and above count.
        const newMaxUses = calculateSpellMaxUses(assignedActor, skill.skill, skill.rankRequirement, true);
        return {
          ...skill,
          maxUses: newMaxUses,
        };
      }
      // For item-based skills (or any others), leave them as is.
      return { ...skill };
    });
    return { skills: updatedSkills };
  },
  isNoCheck: true,
  resolveBonuses: async ({ checkResult, baseBonus }) => {
    checkResult = await getManualResult();
    const value = Math.floor(checkResult / 5);
    return Promise.resolve([{
      ...baseBonus,
      type: bonusTypes.infirmHealed,
      value,
    }]);
  },
};
