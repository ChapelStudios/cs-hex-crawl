import { calculateSpellMaxUses } from "../../helpers/entityTools.js";
import { bonusTypes } from "./checkOnFaction.js";

export const illusoryIntervention =   {
  title: "Illusory Intervention",
  id: "illusoryIntervention",
  timeCost: 2,
  repeatable: false,
  useIndependentTracking: false,
  details: `
    <p><em>Requires the ability to cast Illusion spells</em></p>
    <p>
      You can expend a 1st-level spell slot to cast illusions around the camp, 
      lowering the chances of an attack during the night and negating some of the effects of the campfire.
    </p>
  `,
  aidSkills: [],
  skills: [
    {
      skill: "arcane-1",
      display: "Illusion Spell",
      rankRequirement: 1, // Spell level requirement
      maxUses: 0, // Default value; will be overridden by getSelectionData
      dc: "N/A",
    },
  ],
  getEnrichedData: ({ assignedActor, activity }) => {
    // For spell-based skills (divine/arcane), override maxUses with the sum of available uses.
    const updatedSkills = activity.skills.map((skill) => {
      if (skill.skill === "arcane") {
        // Calculate total available uses for the spellcasting type.
        // Here, we pass in includeHigherLevels = true so that spells at the specified level and above count.
        const specialization = assignedActor.items.find(x => x.name.endsWith("Spell School"));
        const canCastSchool = !specialization?.system.spellSpecializationForbiddenNames.includes('ill');
        const newMaxUses = canCastSchool
          ? calculateSpellMaxUses(assignedActor, skill.skill, skill.rankRequirement, true)
          : 0;
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
  resolveBonuses: async ({ baseBonus }) => Promise.resolve([{
    ...baseBonus,
    type: bonusTypes.attackPreventionBonus,
    value: 5,
  }]),
};