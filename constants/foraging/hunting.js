import { bountyTypes } from "../enumsObjects.js";
import { localeTypes } from "../moveCosts.js";
import { artPath } from "../paths.js";

export const huntingBountyInfo = {
  name: "Hunting",
  icon: artPath('hunting.png'),
  defaultWeight: 35,
  isComplete: false,
  type: bountyTypes.hunting,
  bonuses: [
    {
      locale: [
        localeTypes["Pax Tharkas"],
        localeTypes.SkullCap,
        localeTypes.bog,
        localeTypes.lake,
        localeTypes.swamp,
      ],
      weightBonus: 0,
      yieldBonus: 0,
    },
    {
      locale: [
        localeTypes.forest,
        localeTypes.shore,
      ],
      weightBonus: 2,
      yieldBonus: 2
    },
    {
      locale: [
        localeTypes.road,
      ],
      weightBonus: 0.5,
      yieldBonus: 0.5,
    },
    {
      locale: [
        localeTypes.river,
      ],
      weightBonus: 1,
      yieldBonus: 1.5,
    },
  ],
  yields: [
    {
      name: "Bear",
      foodUnits: (yieldBonus) => `${Math.floor(5 + yieldBonus)}d40 + ${(150 * yieldBonus) + 200}`,
      // Min: 356 (1), Max: 590 (1)
      // Min: 1010 (4), Max: 1540 (4)
      foodWeight: 14,
      chance: 10,
      locale: {
        [localeTypes.forest]: 10,
        [localeTypes.mountain]: 10,
        [localeTypes.hill]: 5,
        [localeTypes.river]: 15,
        [localeTypes.shore]: 15,
      },
    },
    {
      name: "Mountain Goat",
      foodUnits: (yieldBonus) => `(${Math.floor(3 + yieldBonus)}d12 + ${(80 * yieldBonus) + 40}) * 2`,
      // Min: 168 (1), Max: 336 (1)
      // Min: 576 (4), Max: 960 (4)
      foodWeight: 14,
      chance: 12,
      locale: {
        [localeTypes.mountain]: 15,
        [localeTypes.foothill]: 10,
        [localeTypes.hill]: 5,
      },
    },
    {
      name: "Deer",
      foodUnits: (yieldBonus) => `(${Math.floor(4 + yieldBonus)}d15 * ${yieldBonus}) + ${(10 * yieldBonus) + 90}`,
      // Min: 140 (1), Max: 405 (1)
      // Min: 260 (4), Max: 930 (4)
      foodWeight: 14,
      chance: 15,
      locale: {
        [localeTypes.forest]: 12,
        [localeTypes.mountain]: 8,
        [localeTypes.hill]: 10,
        [localeTypes.snowfield]: 5,
      },
    },
    {
      name: "Elk",
      foodUnits: (yieldBonus) => `(${Math.floor(6 + yieldBonus)}d18 * (${Math.max(1, yieldBonus / 2)})) + ${(60 * yieldBonus) + 120}`,
      // Min: 162 (1), Max: 240 (1)
      // Min: 330 (4), Max: 672 (4)
      foodWeight: 14,
      chance: 8,
      locale: {
        [localeTypes.mountain]: 12,
        [localeTypes.foothill]: 8,
        [localeTypes.forest]: 6,
      },
    },
    {
      name: "Rabbit",
      foodUnits: (yieldBonus) => `(${Math.floor(2 + yieldBonus)}d6 * (${Math.max(1, yieldBonus / 2)})) + ${(20 * yieldBonus) + 40}`,
      // Min: 63 (1), Max: 78 (1)
      // Min: 176 (4), Max: 206 (4)
      foodWeight: 14,
      chance: 25,
      locale: {
        [localeTypes.mountain]: 10,
        [localeTypes.foothill]: 15,
        [localeTypes.forest]: 5,
        [localeTypes.snowfield]: 15,
      },
    },
    {
      name: "Wild Turkey",
      foodUnits: (yieldBonus) => `${Math.floor(3 + yieldBonus) * 30}d4 + ${(50 * yieldBonus) + 60}`,
      // Min: 230 (1), Max: 150 (1)
      // Min: 870 (4), Max: 1020 (4)
      foodWeight: 14,
      chance: 18,
      locale: {
        [localeTypes.hill]: 12,
        [localeTypes.foothill]: 10,
        [localeTypes.forest]: 8,
        [localeTypes.snowfield]: 15,
      },
    },
    {
      name: "Mountain Lion",
      foodUnits: (yieldBonus) => `${Math.floor(5 + yieldBonus)}d20 + ${(50 * (1 + yieldBonus))}`,
      // Min: 106 (1), Max: 220 (1)
      // Min: 230 (4), Max: 360 (4)
      foodWeight: 14,
      chance: 5,
      locale: {
        [localeTypes.mountain]: 10,
        [localeTypes.foothill]: 5,
        [localeTypes.road]: 20,
      },
    },
  ],  
};