import { refugeeTypes } from "../constants/moveCosts.js";
import { defaultFactions } from "./factionInfo.js"

export const initFactions = async (scene) => {
  const factionData = getStartingFactionData();
  await scene?.update({
    ['flags.hexCrawl.factions']: factionData,
  });
  return getFactionPopulationTotals(scene);
};

export const getStartingFactionData = () => {
  return defaultFactions.map(faction => {
    const infirmCount = Math.ceil(faction.startingPopulation * faction.infirmPercentage);
    const availablePopulation = faction.startingPopulation - infirmCount;
    const warriorCount =  Math.ceil(availablePopulation * faction.warriorPercentage);
    const foragerCount =  Math.ceil(availablePopulation * faction.foragerPercentage);

    return {
      ...faction,
      population: {
        total: faction.startingPopulation,
        infirm: infirmCount,
        warriors: warriorCount,
        foragers: foragerCount,
      },
    };
  });
};

export const getFactionData = (scene) => scene?.flags.hexCrawl?.factions || [];
export const resetFactionData = async (scene) => await setFactionData(scene, []);
export const setFactionData = async (scene, factions) => {
  await scene?.update({ ['flags.hexCrawl.factions']: factions });
};

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