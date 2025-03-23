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
