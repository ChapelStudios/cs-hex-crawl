import { checkOnFaction } from "./checkOnFaction.js";
import { createWeapons } from "./createWeapons.js";
import { farSight } from "./farSight.js";
import { gatherFirewood } from "./gatherFirewood.js";
import { healTheInfirm } from "./healTheInfirm.js";
import { illusoryIntervention } from "./illusoryIntervention.js";
import { improveMedicine } from "./improveMedicine.js";
import { influenceAFaction } from "./influenceAFaction.js";
import { organizeForagers } from "./organizeForagers.js";
import { performMiracles } from "./performMiracles.js";
import { prepareBanquet } from "./prepareBanquet.js";
import { setPerimeter } from "./setPerimeter.js";

export const campActionsData = [
  checkOnFaction,
  createWeapons,
  farSight,
  gatherFirewood,
  healTheInfirm,
  illusoryIntervention,
  improveMedicine,
  influenceAFaction,
  organizeForagers,
  performMiracles,
  prepareBanquet,
  setPerimeter,
];

export const getActivityById = (activityId) => {
  return campActionsData.find(ca => ca.id === activityId);
}

/**
 * Retrieves the display name for a given skill code.
 * @param {string} skillCode - The skill code to look up.
 * @returns {string|null} - The display name of the skill, or null if not found.
 */
export function getSkillDisplay(skillCode) {
  const skillMappings = {
    blf: "Bluff",
    int: "Intimidate",
    sen: "Sense Motive",
    dip: "Diplomacy",
    gif: "Gather Information",
    lis: "Listen",
    spt: "Spot",
    "crf.subSkills.any": "Craft (Any)",
    dev: "Disable Device",
    str: "Strength",
    "crf.subSkills.crf2": "Craft (Weaponsmith)",
    arcane: "Arcane Divination Spell",
    divine: "Divine Divination Spell",
    sur: "Survival",
    hea: "Heal",
    "crf.subSkills.crf4": "Craft (Alchemy)",
    itemName: "Lay on Hands",
    "crf.subSkills.crf1": "Craft (Cooking)",
    "pro.subSkills.pro1": "Profession (Cook)",
    "crf.subSkills.crf3": "Craft (Trap-Making)",
    dex: "Dexterity",
    int: "Intelligence",
  };

  return skillMappings[skillCode] || null; // Return null if the skill code is not found
}