import { factionCode } from "./common/factions.js";

export const checkOnFaction =  {
  title: "Check into a Faction",
  id: "checkOnFaction",
  timeCost: 1,
  repeatable: true, // can this be repeated by the same player
  useIndependentTracking: true, //players can perform even if others have performed even if not repeatable,
  lockAfterPerform: false,
  actionMaxUses: 0, // this is overridden in getSelectionData
  details: `
    <p>
      Players can make a Gather Information check to talk to a faction's populace. This can have varying outcomes based on the result of the check:
    </p>
    <ul>
      <li><strong>5 or Less:</strong> The populace thinks you're too nosey and the heroes lose standing with that faction.</li>
      <li><strong>10:</strong> Learn about the general attitude of that faction without affecting your reputation.</li>
      <li><strong>15:</strong> Learn any available Key information.</li>
      <li><strong>20:</strong> Gain a +2 bonus next time you interact with that faction's leader.</li>
      <li><strong>25:</strong> Gain bonus standing with that faction.</li>
    </ul>
  `,
  aidSkills: [
    {
      skill: "blf",
      display: "Bluff",
      dc: 10
    },
    {
      skill: "int",
      display: "Intimidate",
      dc: 10
    },
    {
      skill: "sen",
      display: "Sense Motive",
      dc: 10
    },
    {
      skill: "dip",
      display: "Diplomacy",
      dc: 10
    },
    {
      skill: "gif",
      display: "Gather Information",
      dc: 10
    },
    {
      skill: "lis",
      display: "Listen",
      dc: 15
    },
    {
      skill: "spt",
      display: "Spot",
      dc: 15
    }
  ],
  skills: [
    {
      skill: "gif",
      display: "Gather Information",
      rankRequirement: 5,
      dc: "*", // DC has stages based on the result
    },
  ],
  getGmData: () => ({}),
  getEnrichedData: factionCode.setMaxUsesToFactionCount(),
  canAid: factionCode.canAid(),
  canPerform: factionCode.canPerform(),
  onUserPerform: factionCode.onUserPerform(),
  onUserUnselect: factionCode.onUserUnselect(),
  getCheckmarkData: factionCode.getCheckmarkData(),
};