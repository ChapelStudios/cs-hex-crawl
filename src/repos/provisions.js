import { updateToken } from "../helpers/update.js";
import { registerWithSocketReady } from "../socket.js";

export const defaultProvisions = Object.freeze({
  carts: 0,
  blankets: 0,
  foodUnits: 0,
  medicine: 0,
  weapons: 0,
  makeShiftWeapons: 0,
  spices: 0,
  foodWeight: 0,
  currentLoad: 0,
});

// Top Level
export const getProvisions = (token) => {
  return (token?.flags.hexCrawl?.provisions || { ...defaultProvisions });
}
export const resetAllProvisions = async (tokensToReset) => {
  const jobs = tokensToReset.map((token) => updateToken(token, {
    [`flags.hexCrawl.provisions`]: {
      ...defaultProvisions,
    },
  }));
  await Promise.all(jobs);
};
export const updateProvisionsActionName = 'updateProvisions';
export const updateProvisions = async (token, provisionsUpdate) => await updateToken(token, {
  ['flags.hexCrawl.provisions']: {
    ...token.flags.hexCrawl?.provisions,
    ...provisionsUpdate,
  },
}, { diff: false });

registerWithSocketReady(
  updateProvisionsActionName,
  updateProvisions,
);

// Starters
export const getStartingCarts = (bonusCarts = 0) => 40 + bonusCarts;

export const getStartingBlankets = (cartCount = 40, bonusBlankets = 0) => (cartCount * 20) + bonusBlankets;

export const getStartingFoodUnits = (cartCount = 40, bonusFoodPerCart = 0, bonusFood = 0) => {
  return (cartCount * (40 + bonusFoodPerCart)) + bonusFood;
};

export const getStartingProvisions = ({
  bonusCarts = 0,
  bonusBlankets = 0,
  bonusFoodPerCart = 0,
  bonusFood = 0,
  bonusMakeShiftWeapons = 0,
  bonusWeapons = 0,
  bonusMedicine = 0,
  bonusSpices = 0,
  warriorCount = 0,
}) => {
  const carts = getStartingCarts(bonusCarts);
  const blankets = getStartingBlankets(carts, bonusBlankets);
  const foodUnits = getStartingFoodUnits(carts, bonusFoodPerCart, bonusFood);
  const weapons = Math.ceil(warriorCount / 2) + bonusWeapons;

  return {
    carts,
    blankets,
    foodUnits,
    medicine: bonusMedicine,
    weapons,
    makeShiftWeapons: bonusMakeShiftWeapons,
    spices: bonusSpices,
  };
};