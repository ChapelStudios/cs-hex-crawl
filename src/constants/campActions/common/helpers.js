/**
 * Retrieves the display name for a given skill code.
 * @param {string} skillCode - The skill code to look up.
 * @returns {string|null} - The display name of the skill, or null if not found.
 */
export function getSkillDisplay(skillCode) {
  const skillMappings = {
    blf: "Bluff",
    intimidate: "Intimidate",
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
    ken: "Knowledge (Engineering)",
    kge: "Knowledge (Geography)",
    khi: "Knowledge (History)",
    klo: "Knowledge (Local)",
    kna: "Knowledge (Nature)",
    kre: "Knowledge (Religion)",
    kno: "Knowledge (Nobility)",
    kar: "Knowledge (Arcana)",
  };

  return skillMappings[skillCode] || null; // Return null if the skill code is not found
}
