import { refugeeTypes } from "../constants/moveCosts.js";
import { updateScene } from "../helpers/update.js";
import { defaultFactions } from "./factionInfo.js"

export const initFactions = async (scene) => {
  const factionData = getStartingFactionData();
  const startingLogData = factionData.map(faction => ({ 
    id: faction.id, 
    ...faction.population,
  }));
  
  await setFactionData(scene, factionData);
  await setinitialPopulationLog(scene, startingLogData); // Store starting log
  return getFactionPopulationTotals(scene);
};

export const setinitialPopulationLog = async (scene, initialPopulationLog) => {
  await updateScene(scene, { ['flags.hexCrawl.initialPopulationLog']: initialPopulationLog });
};
export const getinitialPopulationLog = (scene) => scene?.flags.hexCrawl?.initialPopulationLog || [];

export const getStartingFactionData = () => {
  return defaultFactions.map(faction => {
    const infirmCount = Math.ceil(faction.startingPopulation * faction.infirmPercentage);
    const availablePopulation = faction.startingPopulation - infirmCount;
    const warriorCount =  Math.ceil(availablePopulation * faction.warriorPercentage);
    const foragerCount =  Math.ceil(availablePopulation * faction.foragerPercentage);
    const infirmDependents = Math.ceil(infirmCount * faction.dependentPercentage);

    return {
      ...faction,
      population: {
        total: faction.startingPopulation,
        infirm: infirmCount,
        warriors: warriorCount,
        foragers: foragerCount,
        infirmDependents,
      },
      currentRep: faction.currentRep,
    };
  });
};

export const getFactionData = (scene) => scene?.flags.hexCrawl?.factions || [];
export const resetFactionData = async (scene) => await setFactionData(scene, []);
export const setFactionData = async (scene, factions) => {
  await updateScene(scene, { ['flags.hexCrawl.factions']: factions });
};

export const updateFactionRep = async (scene, factionId, newRep) => {
  const factions = getFactionData(scene); // Retrieve existing faction data
  const factionIndex = factions.findIndex(f => f.id === factionId);

  if (factionIndex === -1) {
    throw new Error(`Faction with ID "${factionId}" not found.`);
  }

  // Update the currentRep for the specified faction
  factions[factionIndex].currentRep = newRep;

  // Save the updated faction data back to the scene
  await setFactionData(scene, factions);

  return factions[factionIndex]; // Return the updated faction object
};

export const getFactionDataById = (scene, factionId) => {
  const factions = getFactionData(scene); // Retrieve existing faction data
  const faction = factions.find(f => f.id === factionId);

  if (!faction) {
    throw new Error(`Faction with ID "${factionId}" not found.`);
  }

  return faction;
};

export const getFactionRepById = (scene, factionId) => getFactionDataById(scene, factionId).currentRep;

export const getFactionPopulationTotals = (scene) => {
  const factions = getFactionData(scene);
  return factions.reduce((totals, faction) => {
    const {
      total,
      infirm,
      foragers,
      warriors,
    } = faction.population;
    const factionRefugeeCount = total - infirm - foragers - warriors;

    return {
      total: totals.total + total,
      refugees: totals.refugees + factionRefugeeCount,
      infirm: totals.infirm + infirm,
      warriors: totals.warriors + warriors,
      foragers: totals.foragers + foragers,
    };
  }, {
    total: 0,
    infirm: 0,
    warriors: 0,
    foragers: 0,
    refugees: 0,
  });
};

export const requestRefugees = async (scene, request) => {
  const factions = getFactionData(scene);
  const result = {
    total: 0,
    infirm: 0,
    warriors: 0,
    foragers: 0,
    refugees: 0,
    distribution: {}  // Track distribution from each faction
  };

  // Function to randomly assign refugees from a faction
  const assignFromFaction = (faction, type, count) => {
    const availableCount = faction.population[type];
    // Get a random number if we need more than 5 to spread the load across factions
    const assignedCount = availableCount > count && count > 5 
      ? Math.floor(Math.random() * count)
      : Math.min(count, availableCount);
    faction.population[type] -= assignedCount;
    result[type] += assignedCount;
    result.distribution[faction.name] = result.distribution[faction.name] || {};
    result.distribution[faction.name][type] = (result.distribution[faction.name][type] || 0) + assignedCount;
    return assignedCount;
  };

  // List of refugee types to process
  const refugeeTypeList = Object.values(refugeeTypes);

  // Process each type of refugee
  refugeeTypeList.forEach(type => {
    let remaining = request[type];
    while (remaining > 0) {
      const faction = factions[Math.floor(Math.random() * factions.length)];
      if (faction.population[type] > 0) {
        remaining -= assignFromFaction(faction, type, remaining);
      }
    }
  });

  // Calculate total refugees assigned
  result.total = result.infirm + result.warriors + result.foragers + result.refugees;

  // Update scene faction data
  await setFactionData(scene, factions);

  return result;
};

export const returnRefugees = async (scene, returns) => {
  const factions = getFactionData(scene);
  const result = {
    total: 0,
    infirm: 0,
    warriors: 0,
    foragers: 0,
    refugees: 0,
    distribution: {}  // Track distribution back to each faction
  };

  // Function to randomly distribute refugees back to a faction
  const returnToFaction = (faction, type, count) => {
    faction.population[type] += count;
    result[type] += count;
    result.distribution[faction.name] = result.distribution[faction.name] || {};
    result.distribution[faction.name][type] = (result.distribution[faction.name][type] || 0) + count;
  };

  // List of refugee types to process
  const refugeeTypeList = Object.values(refugeeTypes);

  // Process each type of refugee
  refugeeTypeList.forEach(type => {
    let remaining = returns[type];
    while (remaining > 0) {
      const faction = factions[Math.floor(Math.random() * factions.length)];
      const countToReturn = Math.min(remaining, returns[type]);
      remaining -= countToReturn;
      returnToFaction(faction, type, countToReturn);
    }
  });

  // Calculate total refugees returned
  result.total = result.infirm + result.warriors + result.foragers + result.refugees;

  // Update scene faction data
  await setFactionData(scene, factions);

  return result;
};

export const healInfirm = async (scene, healCount) => {
  const factions = getFactionData(scene);

  // Filter factions to only include those with healable infirm
  const eligibleFactions = factions.filter(faction => faction?.population?.infirm);

  // Initialize counters for tracking healed individuals
  const result = {
    healed: 0,
    addedToWarriors: 0,
    addedToForagers: 0,
    addedToRefugees: 0,
    distribution: {}, // Track healing per faction
  };

  if (eligibleFactions.length === 0) {
    console.error("No factions have healable infirm individuals.");
    return result; // Return early if no factions are eligible
  }

  // Process each heal action
  for (let i = 0; i < healCount; i++) {
    // Randomly select a faction from eligible factions
    const randomFaction = eligibleFactions[Math.floor(Math.random() * eligibleFactions.length)];
    const { population, warriorPercentage, foragerPercentage } = randomFaction;

    // Ensure we don't heal more than the healable infirm
    const initialPopulationLog = getinitialPopulationLog(scene);
    const initialFaction = initialPopulationLog.find(f => f.id === randomFaction.id);
    
    if (!initialFaction) {
      console.error(`Initial data for faction ID "${randomFaction.id}" not found.`);
      i--; // Retry this iteration
      continue; // Skip if there's no initial data
    }
    
    const initialInfirm = initialFaction.infirm;
    const dependents = Math.ceil(initialInfirm * randomFaction.dependentPercentage);
    const currentInfirm = randomFaction.population.infirm;
    if (currentInfirm <= dependents) {
      i--; // Retry this iteration
      continue; // Skip this faction if no healable infirm remain
    }

    // Heal one individual and determine their new category
    const randomRoll = Math.random();
    if (randomRoll < warriorPercentage) {
      population.warriors++;
      result.addedToWarriors++;
    } else if (randomRoll < warriorPercentage + foragerPercentage) {
      population.foragers++;
      result.addedToForagers++;
    } else {
      population.refugees = (population.refugees || 0) + 1;
      result.addedToRefugees++;
    }

    // Decrease infirm count
    population.infirm--;
    result.healed++;

    // Track distribution for this faction
    result.distribution[randomFaction.name] = result.distribution[randomFaction.name] || {
      healed: 0,
      addedToWarriors: 0,
      addedToForagers: 0,
      addedToRefugees: 0,
    };
    result.distribution[randomFaction.name].healed++;
    result.distribution[randomFaction.name].addedToWarriors += randomRoll < warriorPercentage ? 1 : 0;
    result.distribution[randomFaction.name].addedToForagers +=
      randomRoll < warriorPercentage + foragerPercentage && randomRoll >= warriorPercentage ? 1 : 0;
    result.distribution[randomFaction.name].addedToRefugees +=
      randomRoll >= warriorPercentage + foragerPercentage ? 1 : 0;
  }

  // Update scene with modified faction data
  await setFactionData(scene, factions);

  return result; // Return a summary of the healing process
};

export const removeInfirmOrGeneral = async (scene, removeCount) => {
  const factions = getFactionData(scene);

  // Filter factions to include those with either infirm or general populace
  const eligibleFactions = factions.filter(faction => faction?.population?.infirm > 0 || faction?.population?.total > 0);

  // Initialize counters for tracking removals
  const result = {
    removedFromInfirm: 0,
    removedFromTotal: 0,
    distribution: {}, // Track removals per faction
  };

  if (eligibleFactions.length === 0) {
    console.error("No factions have populations to remove from.");
    return result; // Return early if no factions are eligible
  }

  // Process each removal action
  for (let i = 0; i < removeCount; i++) {
    // Randomly select a faction from eligible factions
    const randomFaction = eligibleFactions[Math.floor(Math.random() * eligibleFactions.length)];
    const { population } = randomFaction;

    if (population.infirm > 0) {
      // Remove one from infirm
      population.infirm--;
      result.removedFromInfirm++;
    } else if (population.total > 0) {
      // Remove one from the general population if infirm is empty
      population.total--;
      result.removedFromTotal++;
    } else {
      console.warn(`Faction "${randomFaction.name}" has no population left to remove.`);
      i--; // Retry the iteration
      continue;
    }

    // Track distribution for this faction
    result.distribution[randomFaction.name] = result.distribution[randomFaction.name] || { removedFromInfirm: 0, removedFromTotal: 0 };
    if (population.infirm >= 0) {
      result.distribution[randomFaction.name].removedFromInfirm++;
    } else {
      result.distribution[randomFaction.name].removedFromTotal++;
    }
  }

  // Update scene with modified faction data
  await setFactionData(scene, factions);

  return result; // Return a summary of the removal process
};

export const getFactionLosses = (scene, factionId) => {
  const initialPopulationLog = getinitialPopulationLog(scene);
  const currentFactionData = getFactionData(scene);
  
  // Find initial and current faction data by ID
  const initialFaction = initialPopulationLog.find(f => f.id === factionId);
  const currentFaction = currentFactionData.find(f => f.id === factionId);

  if (!initialFaction || !currentFaction) {
    throw new Error(`Faction with ID "${factionId}" not found.`);
  }

  // Calculate total losses
  const totalLosses = initialFaction.total - currentFaction.population.total;

  return totalLosses;
};

