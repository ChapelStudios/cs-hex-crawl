import { bountyTypes } from "../constants/enumsObjects.js";
import { localeTypes } from "../constants/moveCosts.js";
import { getForagingBounty } from "./foraging.js";

class Roll {
  constructor(formula) {
    this.formula = formula;
  }

  async roll() {
    if (this.formula === 0 || this.formula === "0") return Promise.resolve({ total: 0 });

    // Check if the formula is a valid dice notation before proceeding
    const diceNotationPattern = /(\d+)d(\d+)(?: \+ (\d+))?(?: \* (\d+))?/;
    const match = this.formula.match(diceNotationPattern);

    if (!match) {
      throw new Error(`Invalid roll formula: ${this.formula}`);
    }

    const numberOfDice = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const bonus = match[3] ? parseInt(match[3], 10) : 0;
    const multiplier = match[4] ? parseInt(match[4], 10) : 1;

    // Simulate the roll
    let total = 0;
    for (let i = 0; i < numberOfDice; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }

    // Apply the multiplier and add the bonus
    total = total * multiplier + bonus;

    // Return the result
    return Promise.resolve({ total });
  }
}

globalThis.Roll = Roll;

const rollD20 = (bonus) => {
  const roll = Math.floor(Math.random() * 20) + 1; // +1 to account for Math.Random being 0-19
  return roll + bonus;
};

export const prettyPrintJson = (obj, message = "") => {
  if (message) {
    message += "/n";
  }
  console.log(message, JSON.stringify(obj, null, 2));
};

// const fs = require('fs');
import fs from "fs";

const testForagingBounty = async (iterations, bountyTypes = null) => {
  const results = {
    totalRuns: iterations,
    bountyTypes: {},
    totalFoodUnits: 0,
    totalFoodWeight: 0,
    totalMedicine: 0,
    totalSpices: 0,
    highestFoodUnits: 0,
    lowestFoodUnits: Infinity,
    highestFoodWeight: 0,
    lowestFoodWeight: Infinity,
    highestMedicine: 0,
    lowestMedicine: Infinity,
    highestSpices: 0,
    lowestSpices: Infinity,
    bountyTypeResults: {},
    yieldEncountered: {}
  };

  // Use the provided bountyTypes or default to the full list
  const types = bountyTypes || Object.keys(defaultBountyTypes);

  for (let i = 0; i < iterations; i++) {
    const amountOverDC = Math.max(rollD20(8) - 10, 0);
    // Generate amountOverDC for each iteration
    // assume all over 0 for now
    const locales = getRandomLocales();

    // Choose a random bountyType from the provided or default list
    const randomIndex = Math.floor(Math.random() * types.length);
    const selectedBountyType = types[randomIndex];
    const bounty = await getForagingBounty(amountOverDC, locales, selectedBountyType);

    if (bounty) {

      prettyPrintJson(bounty, "bounty")
      // Initialize bounty type results if not already done
      if (!results.bountyTypeResults[selectedBountyType]) {
        results.bountyTypeResults[selectedBountyType] = {
          totalFoodUnits: 0,
          totalFoodWeight: 0,
          totalMedicine: 0,
          totalSpices: 0,
          yields: {},
        };
      }

      // Update bounty type count
      if (!results.bountyTypes[bounty.name]) {
        results.bountyTypes[bounty.name] = 0;
      }
      results.bountyTypes[bounty.name]++;

      // Track the number of times each yield is encountered for the bounty type
      if (!results.bountyTypeResults[selectedBountyType].yields[bounty.yield.name]) {
        results.bountyTypeResults[selectedBountyType].yields[bounty.yield.name] = 0;
      }
      results.bountyTypeResults[selectedBountyType].yields[bounty.yield.name]++;

      // Track the number of times each yield is encountered overall
      if (!results.yieldEncountered[bounty.name]) {
        results.yieldEncountered[bounty.name] = 0;
      }
      results.yieldEncountered[bounty.name]++;

      // Accumulate food units, food weight, medicine, and spices
      const foodUnits = parseInt(bounty.yield.foodUnits);
      results.totalFoodUnits += foodUnits;
      results.bountyTypeResults[selectedBountyType].totalFoodUnits += foodUnits;

      const foodWeight = bounty.yield.foodWeight;
      results.totalFoodWeight += foodWeight;
      results.bountyTypeResults[selectedBountyType].totalFoodWeight += foodWeight;

      const medicine = bounty.yield.medicine || 0;
      results.totalMedicine += medicine;
      results.bountyTypeResults[selectedBountyType].totalMedicine += medicine;

      const spices = bounty.yield.spices || 0;
      results.totalSpices += spices;
      results.bountyTypeResults[selectedBountyType].totalSpices += spices;

      // Update highest and lowest food units, ignoring zeros for lowest
      if (foodUnits > results.highestFoodUnits) {
        results.highestFoodUnits = foodUnits;
      }
      if (foodUnits < results.lowestFoodUnits && foodUnits > 0) {
        results.lowestFoodUnits = foodUnits;
      }

      // Update highest and lowest food weight, ignoring zeros for lowest
      if (foodWeight > results.highestFoodWeight) {
        results.highestFoodWeight = foodWeight;
      }
      if (foodWeight < results.lowestFoodWeight && foodWeight > 0) {
        results.lowestFoodWeight = foodWeight;
      }

      // Update highest and lowest medicine, ignoring zeros for lowest
      if (medicine > results.highestMedicine) {
        results.highestMedicine = medicine;
      }
      if (medicine < results.lowestMedicine && medicine > 0) {
        results.lowestMedicine = medicine;
      }

      // Update highest and lowest spices, ignoring zeros for lowest
      if (spices > results.highestSpices) {
        results.highestSpices = spices;
      }
      if (spices < results.lowestSpices && spices > 0) {
        results.lowestSpices = spices;
      }
    }
  }

  // Calculate averages
  results.averageFoodUnits = results.totalFoodUnits / iterations;
  results.averageFoodWeight = results.totalFoodWeight / iterations;
  results.averageMedicine = results.totalMedicine / iterations;
  results.averageSpices = results.totalSpices / iterations;

  // Calculate yield encounter percentages
  for (const [yieldName, count] of Object.entries(results.yieldEncountered)) {
    results.yieldEncountered[yieldName] = {
      count,
      percentage: ((count / iterations) * 100).toFixed(2) + '%',
    };
  }

  // Calculate yield percentages for each bounty type
  for (const [bountyType, bountyResult] of Object.entries(results.bountyTypeResults)) {
    const totalEncounters = Object.values(bountyResult.yields).reduce((sum, count) => sum + count, 0);
    for (const [yieldName, count] of Object.entries(bountyResult.yields)) {
      bountyResult.yields[yieldName] = {
        count,
        percentage: ((count / totalEncounters) * 100).toFixed(2) + '%',
      };
    }
  }

  // // Write results to a file
  // const filePath = 'C:\\forageTests.json';
  // fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

  prettyPrintJson(results);

  return results;
};


const getRandomLocales = () => {
  const availableLocales = Object.values(localeTypes);
  const numberOfLocales = Math.floor(Math.random() * 3) + 1; // Random number between 1 and 3
  const selectedLocales = [];

  for (let i = 0; i < numberOfLocales; i++) {
    const randomIndex = Math.floor(Math.random() * availableLocales.length);
    selectedLocales.push(availableLocales[randomIndex]);
  }

  return selectedLocales;
};


(async () => {
  const iterations = 10000;

  const stats = await testForagingBounty(iterations, [bountyTypes.hunting, bountyTypes.fishing]);

  console.log('Test Results:', stats);
})();
