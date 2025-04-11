export const circumstances = [
  {
      name: "Each night in the open without cover",
      baseChance: 80,
      degree: "2d10",
      modifiers: [
          {
              name: "No campfires",
              additionalChance: 20,
              degreeMultiplier: 2
          }
      ]
  },
  {
      name: "Each day in camp without moving",
      baseChance: 60,
      degree: "1d10",
      modifiers: []
  },
  {
      name: "Days without adequate food",
      baseChance: 0, // Calculated dynamically
      degree: "1d10",
      dynamicChance: true, // Flag for dynamic calculation
      dynamicChanceMultiplier: 20 // Percentage per unit
  }
];

export const defaultConditionIds = {
  outInTheOpen: "outInTheOpen",
  noCampfires: "noCampfires",
  daysOfRationing: "daysOfRationing",
  infirmRecievedMedicine: "infirmRecievedMedicine",
};

export const defaultConditions = [
  {
    name: "Out in the open without cover",
    id: "outInTheOpen",
    value: false,
    streak: 0,
  },
  {
    name: "No campfires",
    id: "noCampfires",
    value: false,
    streak: 0,
  },
  {
    name: "Days without adequate food",
    id: "daysOfRationing",
    value: false,
    streak: 0,
    disabled: true,
  },
  {
    name: "All infirm getting medicine",
    id: "infirmRecievedMedicine",
    value: false,
    streak: 0,
    disabled: true,
  },
  {
    name: "Did camp move today?",
    id: "didCampMoveToday",
    value: false,
    streak: 0,
  },
  {
    name: "Panic or a route after combat",
    id: "combatPanic",
    value: false,
    streak: 0,
  },
  {
    name: "The camp moved again after making camp",
    id: "breakCamp",
    value: false,
    streak: 0,
  },
  {
    name: "Refugees fought the Dragon Army",
    id: "dragonArmyCombat",
    value: false,
    streak: 0,
  },
  {
    name: "Refugees engaged in standard combat",
    id: "standardCombat",
    value: false,
    streak: 0,
  },
  {
    name: "Refugees had inadequate food",
    id: "inadequateFood",
    value: false,
    streak: 0,
    disabled: true,
  },
  {
    name: "Refugees have reached The Hopeful Vale",
    id: "reachedHopefulVale",
    value: false,
    streak: 0,
  },
];
