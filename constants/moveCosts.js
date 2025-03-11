export const localeTypes = {
  mountain: "mountain",
  foothill: "foothill",
  snowfield: "snowfield",
  hill: "hill",
  forest: "forest",
  road: "road",
  river: "river",
  lake: "lake",
  shore: "shore",
  swamp: "swamp",
  bog: "bog",
  village: "village",
  hotSprings: "hotSprings",
};

export const EventLocationNames = {
  none: "none",
  Skullcap: "Skullcap",
  "Pax Tharkas": "Pax Tharkas",
  "Neidar Village": "Neidar Village",
  "Cold Cathedral": "Cold Cathedral",
}

export const hexTokenTypes = {
  camp: "camp",
  party: "party",
  none: "none",
};

export const refugeeTypes = {
  foragers: "foragers",
  warriors: "warriors",
  infirm: "infirm",
  refugees: "refugees",
};

const eventTypes = {
  terrain: "terrain",
  encounter: "encounter",
  luck: "luck",
  forage: "forage",
};

export const localeInfoLookup = {
  [localeTypes.mountain]: {
    cost: 4,
    display: "Mountain",
  },
  [localeTypes.snowfield]: {
    cost: 1,
    display: "Snowfield",
  },
  [localeTypes.hill]: {
    cost: 2,
    display: "Hill",
  },
  [localeTypes.forest]: {
    cost: 2,
    display: "Forest",
  },
  [localeTypes.road]: {
    cost: 0,
    display: "Road",
  },
};

export const defaultMoves = {
  [hexTokenTypes.camp]: {
    normal: {
      dailyMoves: 6,
      speed: 1.33,
    },
    // heavy: {
    //   dailyMoves: 6,
    //   speed: 1.33,
    // },
  },
  [hexTokenTypes.party]: {
    normal: {
      dailyMoves: 9,
      speed: 0.89,
    },
    heavy: {
      dailyMoves: 6,
      speed: 1.33,
    },
  },
};
