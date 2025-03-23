

export const nullTileId = "None";
export const nullEvent = Object.freeze({
  name: nullTileId,
  isComplete: true,
  isRepeatable: false,
  costFactor: null,
  cost: null,
  costRounding: null,
  description: "",
  locale: [],
  duration: null,
  weight: 0,
  // optionals
  coolDown: null,
  count: null,
  displayName: nullTileId,
  duration: null,
  icon: "",
  isImmediate: false,
  range: null,
});

export const defaultForageEvent = Object.freeze({
  ...nullEvent,
  bonuses: [],
  defaultWeight: 0,
  isForaging: true,
  isForagingComplete: false,
  survivalCheck: null,
  yield: {
    foodUnits: 0,
    foodWeight: 0,
    medicine: 0,
    spices: 0,
    bonus: 0,
    name: nullTileId,
  },
  type: "",
  yields: [],
});