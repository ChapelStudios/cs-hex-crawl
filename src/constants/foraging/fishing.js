import { bountyTypes } from "../enumsObjects.js";
import { localeTypes } from "../moveCosts.js";
import { artPath } from "../paths.js";

export const resultexample = {
  name: "Fishing",
  icon: artPath('fishing.png'),
  yield: {
    name: "",
    foodUnits: 0,
    foodWeight: 0,
  },
};

export const fishingBountyInfo = {
  name: "Fishing",
  icon: artPath('fishing.png'),
  defaultWeight: 25,
  isComplete: false,
  type: bountyTypes.fishing,
  bonuses: [
    {
      locale: [
        localeTypes.river,
      ],
      weightBonus: 2,
      yieldBonus: 1.5,
      isPossible: true,
    },
    {
      locale: [
        localeTypes.lake,
      ],
      weightBonus: 1.5,
      yieldBonus: 3,
      isPossible: true,
    },
    {
      locale: [
        localeTypes["Pax Tharkas"],
        localeTypes.SkullCap,
        localeTypes.bog,
        localeTypes.swamp,
        localeTypes.mountain,
        localeTypes.foothill,
        localeTypes.snowfield,
        localeTypes.hill,
        localeTypes.forest,
        localeTypes.road,
        localeTypes.village,
      ],
      weightBonus: 0,
      yieldBonus: 0,
      isPossible: false,
    },
  ],
  yields: [
    {
      name: "Trout",
      foodUnits: (yieldBonus) => `(${Math.floor(4 + yieldBonus)}d15 * ${yieldBonus}) + ${(10 * yieldBonus) + 90}`,
      // Min: 140 (1), Max: 405 (1)
      // Min: 260 (4), Max: 930 (4)
      foodWeight: 6,
      chance: 20,
      locale: {
        [localeTypes.river]: 10,
        [localeTypes.lake]: 8,
        [localeTypes.shore]: 5,
      },
    },
    {
      name: "Salmon",
      foodUnits: (yieldBonus) => `(${Math.floor(3 + yieldBonus)}d12 + ${(80 * yieldBonus) + 40}) * 2`,
      // Min: 188 (1), Max: 268 (1)
      // Min: 616 (4), Max: 904 (4)
      foodWeight: 10,
      chance: 18,
      locale: {
        [localeTypes.river]: 12,
        [localeTypes.lake]: 10,
        [localeTypes.ocean]: 8,
      },
    },
    {
      name: "Catfish",
      foodUnits: (yieldBonus) => `${Math.floor(3 + yieldBonus)}d25 + ${(50 * yieldBonus) + 40}`,
      // Min: 94 (1), Max: 115 (1)
      // Min: 270 (4), Max: 395 (4)
      foodWeight: 12,
      chance: 15,
      locale: {
        [localeTypes.river]: 15,
        [localeTypes.lake]: 12,
        [localeTypes.shore]: 10,
      },
    },
    {
      name: "Bass",
      foodUnits: (yieldBonus) => `(${Math.floor(6 + yieldBonus)}d12 * (${Math.max(1, yieldBonus / 2)})) + ${(50 * yieldBonus) + 100}`,
      // Min: 186 (1), Max: 228 (1)
      // Min: 498 (4), Max: 876 (4)
      foodWeight: 14,
      chance: 12,
      locale: {
        [localeTypes.lake]: 15,
        [localeTypes.river]: 10,
        [localeTypes.shore]: 8,
      },
    },
    {
      name: "Perch",
      foodUnits: (yieldBonus) => `(${Math.floor(4 + yieldBonus)}d12 * (${Math.max(1, yieldBonus / 2)})) + ${(10 * yieldBonus) + 50}`,
      // Min: 70 (1), Max: 104 (1)
      // Min: 192 (4), Max: 478 (4)
      foodWeight: 4,
      chance: 25,
      locale: {
        [localeTypes.lake]: 15,
        [localeTypes.river]: 12,
        [localeTypes.shore]: 10,
      },
    },
    {
      name: "Pike",
      foodUnits: (yieldBonus) => `${Math.floor(3 + yieldBonus) * 30}d4 + ${(50 * yieldBonus) + 60}`,
      // Min: 200 (1), Max: 270 (1)
      // Min: 560 (4), Max: 1160 (4)
      foodWeight: 8,
      chance: 18,
      locale: {
        [localeTypes.lake]: 15,
        [localeTypes.river]: 12,
        [localeTypes.shore]: 8,
      },
    },
    {
      name: "Tuna",
      foodUnits: (yieldBonus) => `(${Math.floor(5 + yieldBonus)}d50 + ${(200 * yieldBonus) + 200})`,
      // Min: 205 (1), Max: 450 (1)
      // Min: 1220 (4), Max: 1800 (4)
      foodWeight: 20,
      chance: 5,
      locale: {
        [localeTypes.ocean]: 20,
        [localeTypes.shore]: 15,
      },
    },
  ],
};
