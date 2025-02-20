import { localeTypes } from "../moveCosts.js";
import { actionIconPath } from "../paths.js";

export const herbGatheringBountyInfo = {
  name: "Herb Gathering",
  icon: actionIconPath('herb.png'),
  defaultWeight: 5,
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
      name: "Elderflower",
      resources: (yieldBonus) => `${Math.floor(2 + yieldBonus)}d8 + ${(10 * yieldBonus) + 20}`,
      resourceType: 'medicine',
      chance: 15,
      locale: {
        [localeTypes.forest]: 15,
        [localeTypes.hill]: 10,
      },
      description: "Delicate white flowers used to make soothing teas and syrups."
    },
    {
      name: "Star Anise",
      resources: (yieldBonus) => `(${Math.floor(3 + yieldBonus)}d10 * ${yieldBonus}) + ${(20 * yieldBonus) + 30}`,
      resourceType: 'spices',
      chance: 12,
      locale: {
        [localeTypes.forest]: 10,
        [localeTypes.hill]: 8,
        [localeTypes.mountain]: 5,
      },
      description: "A star-shaped spice with a sweet, licorice-like flavor."
    },
    {
      name: "Goldenroot",
      resources: (yieldBonus) => `${Math.floor(4 + yieldBonus)}d12 + ${(30 * yieldBonus) + 50}`,
      resourceType: 'medicine',
      chance: 10,
      locale: {
        [localeTypes.mountain]: 20,
        [localeTypes.hill]: 15,
      },
      description: "A potent root known for its healing properties."
    },
    {
      name: "Fire Pepper",
      resources: (yieldBonus) => `${Math.floor(5 + yieldBonus)}d15 + ${(40 * yieldBonus) + 70}`,
      resourceType: 'spices',
      chance: 8,
      locale: {
        [localeTypes.mountain]: 15,
        [localeTypes.hill]: 10,
      },
      description: "A fiery pepper that adds heat and flavor to dishes."
    },
    {
      name: "Moonleaf",
      resources: (yieldBonus) => `(${Math.floor(3 + yieldBonus)}d12 + ${(25 * yieldBonus) + 40}) * 2`,
      resourceType: 'medicine',
      chance: 18,
      locale: {
        [localeTypes.forest]: 15,
        [localeTypes.mountain]: 12,
        [localeTypes.hill]: 8,
      },
      description: "Silvery leaves known for their calming effects."
    },
    {
      name: "Gingerroot",
      resources: (yieldBonus) => `${Math.floor(2 + yieldBonus)}d10 + ${(20 * yieldBonus) + 30}`,
      resourceType: 'spices',
      chance: 20,
      locale: {
        [localeTypes.hill]: 15,
        [localeTypes.foothill]: 10,
      },
      description: "A spicy root used to add zest to foods and drinks."
    },
    {
      name: "Lavender",
      resources: (yieldBonus) => `${Math.floor(3 + yieldBonus)}d8 + ${(15 * yieldBonus) + 25}`,
      resourceType: 'medicine',
      chance: 15,
      locale: {
        [localeTypes.hill]: 15,
        [localeTypes.mountain]: 10,
        [localeTypes.forest]: 10,
      },
      description: "Fragrant purple flowers known for their relaxing scent."
    },
    {
      name: "Cinnabark",
      resources: (yieldBonus) => `${Math.floor(4 + yieldBonus)}d10 + ${(25 * yieldBonus) + 40}`,
      resourceType: 'spices',
      chance: 12,
      locale: {
        [localeTypes.forest]: 12,
        [localeTypes.hill]: 10,
      },
      description: "The aromatic bark used to produce cinnamon."
    },
    {
      name: "Frostmint",
      resources: (yieldBonus) => `${Math.floor(3 + yieldBonus)}d12 + ${(20 * yieldBonus) + 35}`,
      resourceType: 'spices',
      chance: 8,
      locale: {
        [localeTypes.snowfield]: 15,
        [localeTypes.mountain]: 10,
      },
      description: "A cool and refreshing herb with a minty flavor."
    },
  ],
};
