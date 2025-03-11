import { bountyTypes } from "../enumsObjects.js";
import { localeTypes } from "../moveCosts.js";
import { artPath } from "../paths.js";

export const honeyBountyInfo = {
  name: "Honey",
  icon: artPath('honey.png'),
  defaultWeight: 10,
  isComplete: false,
  type: bountyTypes.honey,
  bonuses: [
    {
      locale: [
        localeTypes.forest,
        localeTypes.hill,
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
        localeTypes.road,
      ],
      weightBonus: 0,
      yieldBonus: 0,
      isPossible: false
    },
  ],
  yields: [
    {
      name: "Honey",
      foodUnits: (yieldBonus) => `${Math.floor(2 + yieldBonus)}d8 + ${(25 * yieldBonus) + 50}`,
      foodWeight: 3,
      chance: 10,
      locale: {
        [localeTypes.forest]: 10,
        [localeTypes.hill]: 5
      }
    },
  ],
};
