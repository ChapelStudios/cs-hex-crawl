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
      DC: 15,
    },
    {
      skill: "pro.subSkills.pro1",
      display: "Profession (Cook)",
      rankRequirement: 1,
      DC: 15,
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: (context) => ({}),
}