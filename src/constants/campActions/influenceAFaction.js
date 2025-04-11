import { defaultFactions, getNewAttitude } from "../../factions/factionInfo.js";
import { getFactionRepById } from "../../factions/factions.js";
import { extraButtonTypes } from "../enumsObjects.js";
import { bonusTypes } from "./checkOnFaction.js";
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
      skill: "intimidate",
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
    },
    {
      skill: "kno",
      dc: 10
    },
  ],
  skills: [
    {
      skill: "dip",
      display: "Diplomacy",
      rankRequirement: 1,
      dc: "*", // DC has stages based on the result
    },
    {
      skill: "intimidate",
      display: "Intimidate",
      rankRequirement: 1,
      dc: "*", // DC has stages based on the result
    },
    {
      skill: "blf",
      display: "Bluff",
      rankRequirement: 1,
      dc: "*", // DC has stages based on the result
    },
  ],
  getGmData: (context) => ({}),
  getEnrichedData: factionCode.setMaxUsesToFactionCount(),
  canAid: factionCode.canAid(),
  canPerform: factionCode.canPerform(),
  onUserPerform: factionCode.onUserPerform(),
  onUserUnselect: factionCode.onUserUnselect(),
  getCheckmarkData: factionCode.getCheckmarkData(),
  resolveBonuses: async ({ checkResult, actionData, bonuses, scene, baseBonus }) => {
    const intimidates = actionData.aids.filter(a => a.skill === "intimidate")
      .map(ia => ({
        ...baseBonus,
        type: bonusTypes.intimidationTactic,
        value: ia.checkResult.total,
      }));

    const factionId = actionData.category;
    const faction = defaultFactions.find(f => f.id === factionId);
    const welfareBonus = bonuses.filter(b => 
      b.type === bonusTypes.factionLeaderBonus
      && b.category === factionId
      && !b.wasApplied
    ).reduce((total, bonus) => {
      bonus.wasApplied = true;
      return total + (bonus.value ?? 0)
    }, 0);

    checkResult += welfareBonus;
    const startingAttitude = getFactionRepById(scene, factionId);
    const {
      newReputation: changedAttitude,
      shift,
    } = getNewAttitude(startingAttitude, checkResult, faction.maxRep);
    // await updateFactionRep(scene, factionId, changedAttitude);
    const resultString = startingAttitude === changedAttitude
      ? `${faction.name}'s Leader's attitude towards the Heroes of Pax Tharkas has not shifted from ${startingAttitude}.`
      : `${faction.name}'s Leader's attitude towards the Heroes of Pax Tharkas has shifted from ${startingAttitude} to ${changedAttitude}`;
    


    return Promise.resolve([
      ...intimidates,
      {
        ...baseBonus,
        type: bonusTypes.factionReputationAdjust,
        value: 50 * shift,
      },
      {
        ...baseBonus,
        type: bonusTypes.message,
        value: resultString,
        category: factionId,
        wasApplied: true,
      },
      {
        ...baseBonus,
        type: bonusTypes.factionWasContacted,
        value: true,
      }
    ]);
  },
  extraButtons: [
    {
      id: "violentInteraction",
      type: extraButtonTypes.checkBox,
      label: "Got Violent?",
      action: (event, { baseBonus, bonuses }) => {
        const newValue = event.target.checked;
        const existingBonus = bonuses.find(b => b.type === bonusTypes.violentInteraction);
        if (existingBonus) {
          existingBonus.value = newValue;
          return [];
        }
        else {
          return [{
            ...baseBonus,
            type: bonusTypes.violentInteraction,
            value: newValue,
          }];
        }
      }
    }
  ]
}