export const repLevels = {
  hostile: "Hostile",
  unfriendly: "Unfriendly",
  indifferent: "Indifferent",
  friendly: "Friendly",
  helpful: "Helpful",
};

export const factions = {
  Townsfolk: "Townsfolk",
  Seekers: "Seekers",
  Believers: "Believers",
  PlainsFolk: "PlainsFolk",
  FreeFolk: "Free Folk",
  Kagonesti: "Luin'l Kagonesti",
}

export const defaultFactions = [
  {
    id: "Townsfolk",
    name: factions.Townsfolk,
    startingPopulation: 188,
    warriorPercentage: 0.02,
    foragerPercentage: 0.13,
    infirmPercentage: 0.04,
    currentRep: repLevels.friendly,
    repModifiers: [

    ],
    enemies: [
      factions.Seekers,
      factions.PlainsFolk,
    ],
    allies: [
      factions.Believers,
    ],
  },
  {
    id: "Seekers",
    name: factions.Seekers,
    startingPopulation: 249,
    warriorPercentage: 0.07,
    foragerPercentage: 0.02,
    infirmPercentage: 0.17,
    currentRep: repLevels.hostile,
    repModifiers: [

    ],
    enemies: [
      factions.Believers,
      factions.PlainsFolk,
    ],
    allies: [
      factions.FreeFolk,
    ],
  },
  {
    id: "Believers",
    name: factions.Believers,
    startingPopulation: 38,
    warriorPercentage: 0,
    foragerPercentage: 0.1,
    infirmPercentage: 0.18,
    currentRep: repLevels.helpful,
    repModifiers: [

    ],
    enemies: [
      factions.Seekers,
    ],
    allies: [],
  },
  {
    id: "PlainsFolk",
    name: factions.PlainsFolk,
    startingPopulation: 204,
    warriorPercentage: 0.22,
    foragerPercentage: 0.42,
    infirmPercentage: 0.16,
    currentRep: repLevels.unfriendly,
    repModifiers: [

    ],
    enemies: [
      factions.Townsfolk,
    ],
    allies: [],
  },
  {
    id: "FreeFolk",
    name: factions.FreeFolk,
    startingPopulation: 49,
    warriorPercentage: 0.37,
    foragerPercentage: 0.15,
    infirmPercentage: 0.06,
    currentRep: repLevels.hostile,
    repModifiers: [

    ],
    enemies: [
      factions.Believers,
    ],
    allies: [
      factions.Seekers,
    ],
  },
  {
    id: "Kagonesti",
    name: factions.Kagonesti,
    startingPopulation: 139,
    warriorPercentage: 0.19,
    foragerPercentage: 0.66,
    infirmPercentage: 0.43,
    currentRep: repLevels.indifferent,
    repModifiers: [

    ],
    enemies: [
      factions.Seekers,
      factions.Townsfolk,
    ],
    allies: [
      factions.PlainsFolk,
    ],
  },
];