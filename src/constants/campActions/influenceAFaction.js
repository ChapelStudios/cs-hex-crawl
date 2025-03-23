import { factionCode } from "./common/factions.js";

export const influenceAFaction = {
  title: "Influence a Faction Leader",
  id: "influenceAFaction",
  timeCost: 1,
  repeatable: true,
  useIndependentTracking: false,
  actionMaxUses: 0, // this is overridden in getSelectionData
  details: `
    <p>
      Check what the various faction leaders are concerned with and attempt to influence them with a Diplomacy check.
    </p>
    <p><em>This can be repeated once per faction.</em></p>
    <p><em>Beware, some factions and their leaders respond differently to different secondary skill tactics.</em></p>
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
      skill: "spt",
      display: "Spot",
      dc: 15
    },
    {
      skill: "lis",
      display: "Listen",
      dc: 15
    }
  ],
  skills: [
    {
      skill: "dip",
      display: "Diplomacy",
      rankRequirement: 5,
      DC: "*", // DC has stages based on the result
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: factionCode.setMaxUsesToFactionCount(),
  canAid: factionCode.canAid(),
  canPerform: factionCode.canPerform(),
  onUserPerform: factionCode.onUserPerform(),
  onUserUnselect: factionCode.onUserUnselect(),
  getCheckmarkData: factionCode.getCheckmarkData(),
}