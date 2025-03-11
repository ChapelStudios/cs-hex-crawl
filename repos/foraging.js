import { bountyTypes } from "../constants/enumsObjects.js";
import { bountyInformation } from "../constants/events/foraging.js";
import { herbGatheringBountyInfo } from "../constants/foraging/herbs.js";
import { requestSkillCheckActionName } from "../helpers/entityTools.js";
import { evaluateFormula, rollWeighted } from "../helpers/math.js";
import { executeForActorsAsync } from "../socket.js";
import { getPartyConfig, getTokenPartyMembers, isCampToken, isPartyToken } from "./gameSettings.js";
import { adjustCurrentMoves } from "./moves.js";
// import { prettyPrintJson } from "./foraging.tests.js";
import { getTileEvents, getTileLocale, updateForageData } from "./tiles.js";

const calculateSkillBonus = (amountOverDC) => {
  let skillBonus = 0;

  if (amountOverDC > 0) {
    if (amountOverDC < 10) {
      skillBonus = amountOverDC * 0.1; // 0.1 per point for amountOverDC less than 10
    } else if (amountOverDC >= 10 && amountOverDC < 15) {
      skillBonus = amountOverDC * 0.25; // 0.25 per point from 10 to 14
    } else if (amountOverDC >= 15 && amountOverDC < 20) {
      skillBonus = amountOverDC * 0.5; // 0.5 per point from 15 to 19
    } else if (amountOverDC >= 20 && amountOverDC < 25) {
      skillBonus = amountOverDC * 1; // 1 per point from 20 to 24
    } else if (amountOverDC >= 25) {
      skillBonus = amountOverDC * 2; // 2 per point from 25 onwards
    }
  }

  return skillBonus;
}

const calculateBountyWeightWithBonuses = (bountyInfo, locales) => {
  let weight = bountyInfo.defaultWeight;

  for (const locale of locales) {
    const foundBonuses = bountyInfo.bonuses.filter(b => b.locale.includes(locale));
    
    for (const bonus of foundBonuses){
      if (bonus.isPossible === false) {
        return 0;  // Return immediately if not possible
      }
      weight *= bonus.weightBonus;
    }
  }
  // if (weight === 0) {
  //   prettyPrintJson(weight, "calculated weight");

  //   prettyPrintJson(locales, "locales");
  //   prettyPrintJson(bountyInfo.bonuses, "bonuses");
  // }
  
  return weight;
};

const calculateYieldWeight = (yieldInfo, locales) => {
  // Start with the base chance as weight
  let weight = yieldInfo.chance;

  // Loop through the locales to apply any additive weight bonuses
  locales.forEach(locale => {
    if (yieldInfo.locale[locale] !== undefined) {
      weight += yieldInfo.locale[locale]; // Add the locale bonus to the weight
    }
  });

  return weight;
};

const getYieldWeights = (yields, locales) => {
  return yields.map(yieldInfo => ({
    ...yieldInfo,
    weight: calculateYieldWeight(yieldInfo, locales),
  }));
};

const getBaseYieldBonus = (bountyInfo, locales) => {
  let baseYieldBonus = 1; // Start with a base value of 1 for multiplicative purposes

  for (const locale of locales) {
    const foundBonuses = bountyInfo.bonuses.filter(b => b.locale.includes(locale));
    for (const bonus of foundBonuses) {
      baseYieldBonus *= bonus.yieldBonus;
    }
  }

  return baseYieldBonus;
};

const getRandomBountyType = async (locales) => {
  const bountyObjects = Object.keys(bountyInformation).map(bountyType => {
    const bountyInfo = bountyInformation[bountyType];
    return {
      type: bountyType,
      weight: calculateBountyWeightWithBonuses(bountyInfo, locales),
    };
  });

  if (bountyObjects.every(b => b.weight === 0)) {
    return null;
  }

  // Use rollWeighted to select a random bounty type
  const selectedBounty = await rollWeighted(bountyObjects);

  return selectedBounty.type;
};

const calculateSkillBonusForHerbs = (amountOverDC) => {
  if (amountOverDC > 0) {
    if (amountOverDC < 10) {
      return 1;
    } else if (amountOverDC >= 10 && amountOverDC < 15) {
      return 2;
    } else if (amountOverDC >= 15 && amountOverDC < 20) {
      return 3;
    } else if (amountOverDC >= 20 && amountOverDC < 25) {
      return 5;
    } else if (amountOverDC >= 25) {
      return 6;
    }
  }

  return 0;
};

const unsuccessfulForage = Object.freeze({
  name: "Unsuccessful Forage",
  isComplete: true,
  isRepeatable: false,
  costFactor: null,
  cost: null,
  costRounding: null,
  description: "While this had looked like a good spot for XXX it turned out to be an uneventful expedition.",
  locale: [],
  duration: null,
  weight: 0,
});

const gatherHerbs = async (amountOverDC, locales) => {
  const results = [];
  let totalMedicine = 0;
  let totalSpices = 0;
  // Calculate the base yield bonus
  const baseYieldBonus = getBaseYieldBonus(herbGatheringBountyInfo, locales);

  // Calculate the number of herbs to gather based on skill bonus
  const numberOfHerbs = calculateSkillBonusForHerbs(amountOverDC);
  
  const herbYields = [...herbGatheringBountyInfo.yields];

  for (let i = 0; i < numberOfHerbs; i++) {
    // Select a random herb to gather
    const selectedHerb = herbYields[Math.floor(Math.random() * herbYields.length)];
    
    // Get the resource formula based on the base yield bonus
    const resourceFormula = selectedHerb.resources(baseYieldBonus);

    // Roll for the quantity of the resource
    const roll = new Roll(resourceFormula);
    const quantity = await roll.roll();

    // Track the total resources found
    if (selectedHerb.resourceType === 'medicine') {
      totalMedicine += quantity.total;
    } else if (selectedHerb.resourceType === 'spices') {
      totalSpices += quantity.total;
    }

    results.push({
      name: selectedHerb.name,
      resourceType: selectedHerb.resourceType,
      quantity: quantity.total,
      description: selectedHerb.description,
    });
  }

  // Generate the display string of all names in the results
  const displayName = results.map(herb => herb.name).join(', ');

  return {
    type: bountyTypes.herb,
    name: herbGatheringBountyInfo.name,
    icon: herbGatheringBountyInfo.icon,
    yield: {
      name: displayName,
      foodUnits: 0,
      foodWeight: 0, // herbs don't have weight
      bonus: baseYieldBonus,
      medicine: totalMedicine,
      spices: totalSpices,
      details: results,
    },
  };
};

const forageNonHerbs = async (amountOverDC, locales, bountyType) => {
  // Get the selected bounty's information
  const bountyInfo = bountyInformation[bountyType];
  const possibleYields = bountyInfo.yields; // Assuming each bounty info has a yields property
  
  // Calculate the weights for various yields
  const yieldWeights = getYieldWeights(possibleYields, locales);

  // Select a random yield
  const selectedYield = await rollWeighted(yieldWeights);
  
  // Calculate the base yield bonus
  const baseYieldBonus = getBaseYieldBonus(bountyInfo, locales);
  
  // Calculate the skill bonus
  const skillBonus = calculateSkillBonus(amountOverDC);

  // Calculate the final yield bonus incorporating the skill bonus
  const skillYieldBonus  = 1 + (skillBonus / 100); // Assuming base yield bonus of 1
  const finalYieldBonus = skillYieldBonus * baseYieldBonus;

  const foodUnitsFormula = selectedYield.foodUnits(finalYieldBonus);
  

  const foodUnits = Math.ceil(await evaluateFormula(foodUnitsFormula));

  // Return the full bounty with the selected yield
  return {
    type: bountyType,
    name: bountyInfo.name,
    icon: bountyInfo.icon,
    description: selectedYield.name,
    yield: {
      name: selectedYield.name,
      foodUnits,
      foodWeight: selectedYield.foodWeight, // Assuming each yield has a foodWeight property
      bonus: finalYieldBonus,
      medicine: 0,
      spices: 0,
      details: null,
    },
  };
}

const processRollResults = (rollResults) => {
  let highestKey = null;
  let highestTotal = -Infinity;
  let keysAboveTen = [];
  let keysBelowTen = [];
  const DC = 10;

  // Loop through the object to find the highest key and create the list of keys with totals above 10

  for (const [key, { total }] of Object.entries(rollResults)) {
    const meetsDC = total >= DC;
    if (meetsDC) {
      keysAboveTen.push(key)
    }
    else {
      keysBelowTen.push(key);
    }

    if (total > highestTotal) {
      highestTotal = total;
      highestKey = key;
    }
  }

  const assists = keysAboveTen.filter(k => k !== highestKey);
  const useless = keysBelowTen.filter(k => k !== highestKey);

  const assistBonus = (assists.length * 2);

  return {
    leadForager: highestKey,
    leadResult: highestTotal,
    assists,
    useless,
    assistBonus,
    total: assistBonus + highestTotal,
  };
};

export const foragingSocketConfig = socket => {
  socket.register(
    forageBountyActionName,
    forageBounty,
  );
};

export const getForagingBounty = async (tile) => {
  const locales = getTileLocale(tile);
  const bounty = await getRandomBountyType(locales);

  return wrapBountyAsEvent(bountyInformation[bounty]);
};

export const forageBountyActionName = 'forageBounty';
export const forageBounty = async (tile, token, cost) => {
  const bountyType = getTileEvents(tile)?.forage?.type;

  if (!bountyType) {
    return null;
  }

  const locales = getTileLocale(tile);
  const survival = "sur";

  const partyActors = getTokenPartyMembers(token)
    .filter(actorId => (game.actors.get(actorId)?.system?.skills[survival]?.rank ?? 0) > 0)
    .map(actor => actor.id);
  const rolls = await executeForActorsAsync(requestSkillCheckActionName, partyActors, survival);

  if (!rolls) {
    ui.notifications.info("no roll data, forage canceled.");
  }

  const partyConfig = getPartyConfig(token);
  
  if (isCampToken(token) || partyConfig.total > 0) {
    rolls['Refugees'] = await new Roll('1d20 + 6').roll();
  }

  const survivalCheck = processRollResults(rolls);
  const amountOverDC = survivalCheck.total - 10;
  survivalCheck.extraForagerBonus = Math.max((partyConfig.foragers ?? 0) - 1, 0) * 2;
  const bonusWithForagers = survivalCheck.extraForagerBonus + amountOverDC;

  const bounty = (amountOverDC < 0)
  ? Promise.resolve({ ...unsuccessfulForage })
  : (bountyType === bountyTypes.herb
    ? await gatherHerbs(bonusWithForagers, locales)
    : await forageNonHerbs(bonusWithForagers, locales, bountyType));

  const forageEvent = wrapBountyAsEvent(await bounty, survivalCheck, cost);
  await adjustCurrentMoves(token, -1 * cost, true);

  return await updateForageData(tile, forageEvent);
};

const wrapBountyAsEvent = (bounty, survivalCheck = null, cost) => {
  return {
    ...bounty,
    isImmediate: true,
    isRepeatable: false,
    ...(survivalCheck ? { 
      survivalCheck,
      isComplete: true,
    } : {
      isComplete: false,
    }),
    isForaging: true,
    cost,
  }
}