export const mountainEncounters = [
  {
    name: "Ember Attacks",
    range: [1,5],
    isImmediate: true,
    count: 1,
    special: () => {
      isVerminaardThere = (new Roll35e("1d3", {})
        .roll()
        .total) === 1;
      
      const verminaardString = isVerminaardThere
        ? "with"
        : "without";

      doesEmberAttack = (new Roll35e("1d3", {})
        .roll()
        .total) !== 3;

      const attackString = doesEmberAttack
        ? "does a breath attack while flying by"
        : "flys by cackling and spreading dragonfear"

      return `Ember is ${verminaardString} Verminaard and ${attackString}!`;
    },
    isRepeatable: true,
  },
  {
    name: "Diseased Dire Wolves",
    range: [6,15],
    isImmediate: false,
    count: "2d4",
    isRepeatable: false,
  },
  {
    name: "Dire Bear",
    range: [16,25],
    isImmediate: false,
    count: 1,
    isRepeatable: true,
  },
  {
    name: "OwlBears",
    range: [26,35],
    isImmediate: false,
    count: "1d3 + 1",
    isRepeatable: false,
  },
  {
    name: "Snow Squall",
    range: [36,45],
    isImmediate: false,
    count: 1,
    hourCost: "2d4 - 1",
    isRepeatable: true,
    special: () => {
      const prepTime = new Roll35e("2d10", {})
        .roll()
        .total;

      return `Players have ${prepTime} minutes before the storm hits in full force.`;
    },
  },
  {
    name: "Goblins",
    range: [46,60],
    isImmediate: false,
    count: "3d6",
    isRepeatable: true,
  },
  {
    name: "Avelanche",
    range: [46,60],
    isImmediate: false,
    count: "3d6",
    isRepeatable: true,
    special: ({ players }) => {
      const startingDistance = (new Roll35e("1d10", {})
        .roll()
        .total) * 500;

      const soundDistance =  (new Roll35e("1d6", {})
        .roll()
        .total) * 500;

      return `Have players make a DC 20 spot check to see the avalanche from ${startingDistance} feet away. Even if not seen, it can e hear at ${soundDistance} feet away with a DC 15 Listen.`
    }
  },
];

const skullCapEncounters = [
  
];