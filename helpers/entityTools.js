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
