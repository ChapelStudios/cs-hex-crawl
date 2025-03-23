import { calculateSpellMaxUses } from "../../helpers/entityTools.js";

export const setPerimeter = {
  title: "Set Perimeter",
  id: "setPerimeter",
  timeCost: 2,
  repeatable: false,
  useIndependentTracking: false,
  details: `
    <p><em>Requires Craft (Trap-Making) 5 ranks or the ability to cast Abjuration spells</em></p>
    <p>
      By either expending a first-level spell slot or succeeding on a DC 15 Craft (Trap-Making) check, 
      you set an alarm around the camp's perimeter. This advance warning gives a +2 to morale checks and 
      a +2 to combat checks if the party is attacked.
    </p>
  `,
  aidSkills: [
    {
      skill: "dev",
      display: "Disable Device",
      dc: 10
    },
    {
      skill: "sur",
      display: "Survival",
      dc: 10
    },
    {
      skill: "dex",
      display: "Dexterity",
      dc: 15
    },
    {
      skill: "int",
      display: "Intelligence",
      dc: 15
    }
  ],
  skills: [
    {
      skill: "crf.subSkills.crf3",
      display: "Craft (Trap-Making)",
      rankRequirement: 5,
      dc: 15,
    },
    {
      skill: "arcane",
      display: "Abjuration Spell",
      rankRequirement: 1, // Spell level requirement
      maxUses: 0, // Default value; will be overridden by getSelectionData
      DC: "N/A",
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: ({ assignedActor, activity }) => {
    // For spell-based skills (divine/arcane), override maxUses with the sum of available uses.
    const updatedSkills = activity.skills.map((skill) => {
      if (skill.skill === "arcane") {
        // Calculate total available uses for the spellcasting type.
        // Here, we pass in includeHigherLevels = true so that spells at the specified level and above count.
        const specialization = assignedActor.items.find(x => x.name.endsWith("Spell School"));
        const canCastSchool = !specialization?.system.spellSpecializationForbiddenNames.includes('abj');
        const newMaxUses = canCastSchool
          ? calculateSpellMaxUses(assignedActor, skill.skill, skill.rankRequirement, true)
          : 0;
        return {
          ...skill,
          maxUses: newMaxUses,
        };
      }
      // For item-based skills (or any others), leave them as is.
      return skill;
    });
    return { skills: updatedSkills };
  },
}