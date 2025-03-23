import { bountyTypes } from "../enumsObjects.js";
import { localeTypes } from "../moveCosts.js";
import { artPath } from "../paths.js";

export const gatheringBountyInfo = {
  name: "Gathering",
  icon: artPath('gathering.png'),
  defaultWeight: 20,
  isComplete: false,
  type: bountyTypes.gathering,
  bonuses: [
    {
      locale: [
        localeTypes.forest,
        localeTypes.hill,
        localeTypes.road,
      ],
      weightBonus: 1,
      yieldBonus: 1,
      isPossible: true
    },
    {
      locale: [
        localeTypes["Pax Tharkas"],
        localeTypes.SkullCap,
        localeTypes.lake,
        localeTypes.swamp,
      ],
      weightBonus: 0,
      yieldBonus: 0,
      isPossible: false
    },
  ],
  yields: [
    {
      name: "Berries",
      foodUnits: (yieldBonus) => `${Math.floor(5 + yieldBonus)}d20 + ${(100 * yieldBonus) + 150}`,
      // Min: 255 (1), Max: 350 (1)
      // Min: 550 (4), Max: 1250 (4)
      foodWeight: 1,
      chance: 25,
      locale: {
        [localeTypes.forest]: 15,
        [localeTypes.hill]: 10,
        [localeTypes.road]: 5,
      },
    },
    {
      name: "Mushrooms",
      foodUnits: (yieldBonus) => `(${Math.floor(4 + yieldBonus)}d18 + ${(20 * yieldBonus) + 50}) * 2`,
      // Min: 220 (1), Max: 308 (1)
      // Min: 736 (4), Max: 1076 (4)
      foodWeight: 2,
      chance: 15,
      locale: {
        [localeTypes.forest]: 20,
        [localeTypes.hill]: 15,
      },
    },
    {
      name: "Nuts",
      foodUnits: (yieldBonus) => `(${Math.floor(6 + yieldBonus)}d20 * ${yieldBonus}) + ${(50 * yieldBonus) + 100}`,
      // Min: 260 (1), Max: 680 (1)
      // Min: 640 (4), Max: 2600 (4)
      foodWeight: 3,
      chance: 12,
      locale: {
        [localeTypes.forest]: 20,
        [localeTypes.hill]: 10,
        [localeTypes.mountain]: 5,
      },
    },
    {
      name: "Roots",
      foodUnits: (yieldBonus) => `(${Math.floor(5 + yieldBonus)}d10 * (${Math.max(1, yieldBonus / 2)})) + ${(50 * yieldBonus) + 60}`,
      // Min: 110 (1), Max: 160 (1)
      // Min: 400 (4), Max: 850 (4)
      foodWeight: 2,
      chance: 18,
      locale: {
        [localeTypes.forest]: 10,
        [localeTypes.hill]: 15,
        [localeTypes.mountain]: 8,
      },
    },
    {
      name: "Wild Vegetables",
      foodUnits: (yieldBonus) => `${Math.floor(6 + yieldBonus) * 5}d10 + ${(50 * yieldBonus) + 100}`,
      // Min: 180 (1), Max: 300 (1)
      // Min: 580 (4), Max: 1300 (4)
      foodWeight: 5,
      chance: 22,
      locale: {
        [localeTypes.hill]: 15,
        [localeTypes.foothill]: 10,
        [localeTypes.forest]: 12,
        [localeTypes.snowfield]: 8,
      },
    },
    {
      name: "Starlight Grapes",
      foodUnits: (yieldBonus) => `(${Math.floor(4 + yieldBonus)}d14 * ${yieldBonus}) + ${(30 * yieldBonus) + 50}`,
      // Min: 140 (1), Max: 220 (1)
      // Min: 370 (4), Max: 1040 (4)
      foodWeight: 3,
      chance: 15,
      locale: {
        [localeTypes.mountain]: 15,
        [localeTypes.hill]: 10,
        [localeTypes.foothill]: 5,
        [localeTypes.snowfield]: 8,
      },
    },
    {
      name: "Moon Pears",
      foodUnits: (yieldBonus) => `${Math.floor(3 + yieldBonus)}d18 + ${(40 * yieldBonus) + 60}`,
      // Min: 120 (1), Max: 200 (1)
      // Min: 330 (4), Max: 620 (4)
      foodWeight: 2,
      chance: 10,
      locale: {
        [localeTypes.mountain]: 15,
        [localeTypes.forest]: 8,
      },
    },
    {
      name: "Sunfire Apples",
      foodUnits: (yieldBonus) => `(${Math.floor(4 + yieldBonus)}d12 + ${(50 * yieldBonus) + 70}) * 2`,
      // Min: 106 (1), Max: 138 (1)
      // Min: 416 (4), Max: 552 (4)
      foodWeight: 5,
      chance: 8,
      locale: {
        [localeTypes.mountain]: 12,
        [localeTypes.hill]: 10,
      },
    },
    {
      name: "Dragonfruit",
      foodUnits: (yieldBonus) => `${Math.floor(5 + yieldBonus)}d20 + ${(80 * yieldBonus) + 100}`,
      // Min: 185 (1), Max: 200 (1)
      // Min: 540 (4), Max: 820 (4)
      foodWeight: 8,
      chance: 5,
      locale: {
        [localeTypes.mountain]: 10,
        [localeTypes.hill]: 5,
        [localeTypes.foothill]: 5,
      },
    },
  ],
};
