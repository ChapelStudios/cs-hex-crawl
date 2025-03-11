import { getNestedProperty } from "../../helpers/entityTools.js";

export const createWeapons = {
  title: "Create Weapons",
  timeCost: 4,
  repeatable: false,
  useIndependentTracking: false,
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
    },
  ],
  getGmData: (context) => ({}),
  getSelectionData: (context) => {
    const { assignedActor, activity } = context;
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
}