export const luckEvents = [
  {
    name: "A Glint in the Snow",
    isComplete: false,
    isRepeatable: true,
    costFactor: null,
    cost: 0,
    costRounding: null,
    description: "text description",
    locale: ["snowfield"],
    duration: 0,
    weight: 3,
  },
  {
    name: "An Opening into the Ground",
    isComplete: false,
    costFactor: 1,
    costRounding: "down",
    description: "text description",
    locale: ["snowfield", "mountain", "hill", "road"],
    duration: "2d4",
    weight: 4,
  },
];

//export const getTileLuckEvent = (scene, tile) => scene.flags.hexCrawl?.[tile._id] ?? null;

//export const getLuckEvent = () => {
//
//};