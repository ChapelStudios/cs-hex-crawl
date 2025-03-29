export const getNestedProperty = (obj, path, defaultValue = undefined) =>
  path.split('.').reduce((current, key) => (current ? current[key] : defaultValue), obj);

export const abilityCodes = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const isAbilityCode = (code) => abilityCodes.includes(code);

export const getD35eSkillName = (skillCode) => {
  return skillCode === "intimidate" ? "int" : skillCode;
}

export const disambiguateSkillCode = (skillCode) => {
  if (isAbilityCode(skillCode)) {
    return false;
  }

  return getD35eSkillName(skillCode);
}

export const requestSkillCheckActionName = "requestSkillCheck";
export const requestSkillCheck = async (actor, skillname) => {
  const disambiguatedSkillCode = disambiguateSkillCode(skillname);
  if (!actor.rollAbilityTest || !actor.rollSkill) {
    actor = game.actors.get(actor._id);
  }
  return disambiguatedSkillCode === false
    ? await actor.rollAbilityTest(skillname)
    : await actor.rollSkill(disambiguatedSkillCode);
};

export const skillCheckSocketConfig = socket => {
  socket.register(
    requestSkillCheckActionName,
    requestSkillCheck
  );
};

export const getActorSkillCodeData = (actor, skillCode) => {
  const disambiguatedSkillCode = disambiguateSkillCode(skillCode);
  if (disambiguatedSkillCode === false) {
    return actor.system.abilities[skillCode];
  }
  return getNestedProperty(actor.system.skills, disambiguatedSkillCode);
}

/**
 * Sorts an array of select option objects so that enabled options come first,
 * then orders them alphabetically by their label.
 * @param {Array} options - Array of option objects, each with a `disabled` (boolean) and `label` (string) property.
 * @returns {Array} The sorted array.
 */
export const sortSkillOptions = (a, b) => {
  // Enabled options (disabled === false) come first.
  if (a.disabled === b.disabled) {
    return a.label.localeCompare(b.label);
  }
  return a.disabled ? 1 : -1; // If a is disabled and b isn't, a goes after.
}

// Helper: Returns the select option for spell-based skills (e.g. "divine" or "arcane")
// Hides the DC from the label.
export const getSelectOptionForSpell = (actor, skillDef) => {
  const spellType = skillDef.skill;         // "divine" or "arcane"
  const spellLevel = skillDef.rankRequirement; // The required spell level
  const spellbooks = actor.system.attributes.spells.spellbooks;
  let available = false;

  Object.keys(spellbooks).forEach((key) => {
    const book = spellbooks[key];
    if (book.spellcastingType === spellType) {
      Object.keys(book.spells).forEach((spellKey) => {
        const regex = /^spell(\d+)$/;
        const match = spellKey.match(regex);
        if (match) {
          const currentLevel = parseInt(match[1], 10);
          // If a spell level is provided, filter by exact match.
          if (spellLevel !== undefined && currentLevel !== spellLevel) return;
          if (book.spells[spellKey].max > 0) {
            available = true;
          }
        }
      });
    }
  });

  return {
    value: skillDef.skill,
    label: `${skillDef.display} (Level: ${spellLevel})`,
    disabled: !available,
    maxUses: (typeof skillDef.maxUses !== "undefined") ? skillDef.maxUses : Infinity,
  };
};

// Helper: Returns the select option for item-based skills (where skill === "itemName")
// In this branch we simply look for an item whose name equals the rankRequirement.
export const getSelectOptionForItem = (actor, skillDef) => {
  const itemExists = actor.items.find(item => item.name === skillDef.rankRequirement);
  return {
    value: skillDef.skill,
    label: `${skillDef.display}`,
    disabled: !itemExists,
    maxUses: (typeof skillDef.maxUses !== "undefined") ? skillDef.maxUses : Infinity,
  };
};


// Helper: Returns the select option for normal perform skills.
// Always shows the DC value (defaulting to 10 if missing) in the label.
export const getSelectOptionForPerform = (actor, skillDef) => {
  const effectiveSkill = disambiguateSkillCode(skillDef.skill);
  const skillData = effectiveSkill === false
    ? actor.system.abilities[skillDef.skill]
    : getNestedProperty(actor.system.skills, effectiveSkill);
  const actorRank = (skillData && skillData.rank) || 0;
  const meetsRequirement = effectiveSkill === false || actorRank >= skillDef.rankRequirement;
  const normalizedDC = (typeof skillDef.dc === "number") ? skillDef.dc : 10;
  const rankDisplay = effectiveSkill !== false
    ? `(Rank: ${skillDef.rankRequirement}) `
    : '';

  return {
    value: skillDef.skill,
    label: `${skillDef.display} ${rankDisplay}[DC ${normalizedDC}]`,
    disabled: !meetsRequirement,
    maxUses: (typeof skillDef.maxUses !== "undefined") ? skillDef.maxUses : Infinity,
  };
};

// Helper: Returns the select option for normal aid skills.
// Always shows the DC value (defaulting to 10 if missing) in the label.
export const getSelectOptionForAid = (actor, skillDef) => {
  const effectiveSkill = disambiguateSkillCode(skillDef.skill);
  let meetsRequirement;
  if (effectiveSkill === false) {
    meetsRequirement = true;
  } else {
    const skillData = getNestedProperty(actor.system.skills, effectiveSkill);
    const actorRank = (skillData && skillData.rank) || 0;
    meetsRequirement = actorRank > 0;
  }
  const normalizedDC = (typeof skillDef.dc === "number") ? skillDef.dc : 10;

  return {
    value: skillDef.skill,
    label: `${skillDef.display} [DC ${normalizedDC}]`,
    disabled: !meetsRequirement,
    maxUses: (typeof skillDef.maxUses !== "undefined") ? skillDef.maxUses : Infinity,
  };
};

// Main exported function that dispatches to the appropriate helper.
/**
 * Returns a select option object based on the actor’s data and a given skill definition.
 *
 * For spell checks:
 *   - If the skill is "divine" or "arcane", searches the actor’s spellbooks (located at
 *     actor.system.attributes.spells.spellbooks) for a book with a matching spellcastingType,
 *     then checks if a spell at the required level (provided in rankRequirement) exists with max > 0.
 *
 * For "itemName" checks:
 *   - When the skill is "itemName", finds an item on the actor whose name matches the provided
 *     rankRequirement (e.g., "Lay on Hands").
 *
 * For "perform" selections (default):
 *   - Disambiguates the skill code via disambiguateSkillCode.
 *   - If disambiguation returns false, retrieves the actor's ability data;
 *     otherwise, fetches the actor's skill data.
 *   - Compares the actor’s rank with rankRequirement.
 *
 * For "aid" selections:
 *   - Uses disambiguation as in perform, but simply requires that the actor has at least one rank.
 *
 * @param {Object} actor - The actor object.
 * @param {Object} skillDef - The skill definition. Expected properties include:
 *   • skill: the skill code (or special string "divine", "arcane", or "itemName")
 *   • display: the display name
 *   • rankRequirement: for spells, this is the required spell level; for skills, the required rank;
 *                       for itemName, this is used as the item name to look up.
 *   • dc (optional): difficulty for aid checks.
 * @param {'perform'|'aid'} [type='perform'] - The type of selection check.
 * @returns {Object} An object with:
 *   • value: the original skill code,
 *   • label: a string to display,
 *   • disabled: a boolean indicating if the option should be disabled.
 */
export const getSelectOptionFromSkill = (actor, skillDef, type = "perform") => {
  if (skillDef.skill === "divine" || skillDef.skill === "arcane") {
    return getSelectOptionForSpell(actor, skillDef);
  }

  if (skillDef.skill === "itemName") {
    return getSelectOptionForItem(actor, skillDef);
  }

  if (type === "perform") {
    return getSelectOptionForPerform(actor, skillDef);
  }

  if (type === "aid") {
    return getSelectOptionForAid(actor, skillDef);
  }

  throw new Error(`Unknown skill selection type: ${type}`);
};

export const generateSkillChoices = (actor, skills, type) => {
  return (skills || [])
    .map(skill => getSelectOptionFromSkill(actor, skill, type))
    .sort(sortSkillOptions);
}

/**
 * Calculates the total available uses for spell-based skills.
 * It calculates the sum of the "max" values from the actor's spellbooks for spells
 * that match the provided spellcasting type. Optionally, it can filter by spell level.
 *
 * @param {Object} actor - The actor object.
 * @param {string} spellType - The spellcasting type to look for (e.g., "divine" or "arcane").
 * @param {number} [spellLevel] - Optional. If provided, limits the count to spells of this level.
 * @param {boolean} [includeHigherLevels=false] - Optional. If true and spellLevel is provided,
 *   include spells with a level equal to or greater than the provided spellLevel.
 * @returns {number} The total available uses (sum of max values) for the filtered spells.
 */
export function calculateSpellMaxUses(actor, spellType, spellLevel, includeHigherLevels = false) {
  let totalMax = 0;
  const spellbooks = actor.system.attributes.spells.spellbooks;

  for (const key in spellbooks) {
    if (Object.hasOwnProperty.call(spellbooks, key)) {
      const book = spellbooks[key];
      if (book.spellcastingType === spellType) {
        for (const spellKey in book.spells) {
          if (Object.hasOwnProperty.call(book.spells, spellKey)) {
            // Expect the keys in the spells object to be in the format "spellX", where X is the level.
            const regex = /^spell(\d+)$/;
            const match = spellKey.match(regex);
            if (match) {
              const currentLevel = parseInt(match[1], 10);
              // If spellLevel is provided, apply filtering
              if (spellLevel !== undefined) {
                if (includeHigherLevels) {
                  if (currentLevel < spellLevel) {
                    continue;
                  }
                } else {
                  if (currentLevel !== spellLevel) {
                    continue;
                  }
                }
              }
              totalMax += book.spells[spellKey].max;
            }
          }
        }
      }
    }
  }

  return totalMax;
}
