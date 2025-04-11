export const repLevels = {
  hostile: "Hostile",
  unfriendly: "Unfriendly",
  indifferent: "Indifferent",
  friendly: "Friendly",
  helpful: "Helpful",
};

export const attitudeChart = {
  hostile: [-Infinity, 20, 25, 35, 50],
  unfriendly: [-Infinity, 5, 15, 25, 40],
  indifferent: [null, -Infinity, 1, 15, 30],
  friendly: [null, null, -Infinity, 1, 20],
  helpful: [null, null, null, -Infinity, 1],
};

export function getNewAttitude(initialAttitude, checkResult, maxPossibleRepLevel = null) {
  const levels = Object.keys(repLevels);
  const currentIndex = levels.indexOf(initialAttitude.toLowerCase());

  // Ensure valid initial attitude
  if (currentIndex === -1) {
    throw new Error("Invalid initial attitude");
  }

  // Determine the upper limit for reputation level
  const maxIndex = maxPossibleRepLevel
    ? levels.indexOf(maxPossibleRepLevel.toLowerCase())
    : levels.length - 1;

  if (maxIndex === -1) {
    throw new Error("Invalid max possible reputation level");
  }

  // Determine thresholds based on initial attitude
  const thresholds = attitudeChart[initialAttitude.toLowerCase()];
  if (!thresholds) {
    throw new Error("Invalid attitude chart for the given initial attitude");
  }

  // Determine new attitude with limited shift
  for (let shift = 1; shift >= -1; shift--) {
    const newIndex = currentIndex + shift;
    if (newIndex < 0 || newIndex > maxIndex) {
      continue; // Skip invalid indices
    }

    let threshold = thresholds[newIndex];
    if (checkResult > threshold) {
      return {
        newReputation: repLevels[levels[newIndex]],
        shift,
      };
    }
  }

  // Default to the original attitude if no change is valid
  return {
    newReputation: repLevels[levels[currentIndex]],
    shift: 0,
  };
};

export function getAttitudeAfterShift(initialAttitude, shift, maxPossibleRepLevel = null) {
  const levels = Object.keys(repLevels);
  const currentIndex = levels.indexOf(initialAttitude.toLowerCase());

  // Ensure valid initial attitude
  if (currentIndex === -1) {
    throw new Error("Invalid initial attitude");
  }

  // Determine the upper limit for reputation level
  const maxIndex = maxPossibleRepLevel
    ? levels.indexOf(maxPossibleRepLevel.toLowerCase())
    : levels.length - 1;

  if (maxIndex === -1) {
    throw new Error("Invalid max possible reputation level");
  }

  // Calculate the new index based on the shift
  const newIndex = currentIndex + shift;

  // Ensure the new index is within valid bounds
  if (newIndex < 0 || newIndex > maxIndex) {
    throw new Error("Shift results in an invalid reputation level");
  }

  // Return the new reputation level
  return repLevels[levels[newIndex]];
}


export const factions = {
  Townsfolk: "Townsfolk",
  Seekers: "Seekers",
  Believers: "Believers",
  PlainsFolk: "PlainsFolk",
  FreeFolk: "Free Folk",
  Kagonesti: "Luin'l Kagonesti",
}

export const defaultFactions = [
  {
    id: "Townsfolk",
    name: factions.Townsfolk,
    startingPopulation: 188,
    warriorPercentage: 0.02,
    foragerPercentage: 0.13,
    infirmPercentage: 0.04,
    dependentPercentage: 0.85,
    maxRep: repLevels.helpful,
    currentRep: repLevels.friendly,
    repModifiers: [

    ],
    enemies: [
      factions.Seekers,
      factions.PlainsFolk,
    ],
    allies: [
      factions.Believers,
    ],
  },
  {
    id: "Seekers",
    name: factions.Seekers,
    startingPopulation: 249,
    warriorPercentage: 0.07,
    foragerPercentage: 0.02,
    infirmPercentage: 0.17,
    dependentPercentage: 0.85,
    currentRep: repLevels.hostile,
    repModifiers: [

    ],
    enemies: [
      factions.Believers,
      factions.PlainsFolk,
    ],
    allies: [
      factions.FreeFolk,
    ],
  },
  {
    id: "Believers",
    name: factions.Believers,
    startingPopulation: 38,
    warriorPercentage: 0,
    foragerPercentage: 0.1,
    infirmPercentage: 0.18,
    dependentPercentage: 0.75,
    currentRep: repLevels.helpful,
    repModifiers: [

    ],
    enemies: [
      factions.Seekers,
    ],
    allies: [],
  },
  {
    id: "PlainsFolk",
    name: factions.PlainsFolk,
    startingPopulation: 204,
    warriorPercentage: 0.22,
    foragerPercentage: 0.42,
    infirmPercentage: 0.16,
    dependentPercentage: 0.25,
    currentRep: repLevels.unfriendly,
    repModifiers: [

    ],
    enemies: [
      factions.Townsfolk,
    ],
    allies: [],
  },
  {
    id: "FreeFolk",
    name: factions.FreeFolk,
    startingPopulation: 49,
    warriorPercentage: 0.37,
    foragerPercentage: 0.15,
    infirmPercentage: 0.06,
    dependentPercentage: 0.75,
    currentRep: repLevels.hostile,
    repModifiers: [

    ],
    enemies: [
      factions.Believers,
    ],
    allies: [
      factions.Seekers,
    ],
  },
  {
    id: "Kagonesti",
    name: factions.Kagonesti,
    startingPopulation: 139,
    warriorPercentage: 0.19,
    foragerPercentage: 0.66,
    infirmPercentage: 0.43,
    dependentPercentage: 0,
    currentRep: repLevels.indifferent,
    repModifiers: [

    ],
    enemies: [
      factions.Seekers,
      factions.Townsfolk,
    ],
    allies: [
      factions.PlainsFolk,
    ],
  },
];