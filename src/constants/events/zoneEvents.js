
const PaxTharkas = {
  zoneId: 1,
  eventList: [
    {
      range: [1,100],
      name: "Enter Pax Tharkas",
      isImmediate: true,
      count: null,
      isRepeatable: true,
      coolDown: null,
    },
  ],
};

const IcePassage = {
  zoneId: 2,
  eventList: [
    {
      range: [1,100],
      name: "Dragon Army Scounting Party",
      isImmediate: true,
      count: "1d8",
      isRepeatable: true,
      coolDown: 12,
    },
  ],
};

const SouthernRoad = {
  zoneId: 3,
  eventList: [],
};

const CanyonTrail = {
  zoneId: 4,
  eventList: [],
};

const Spire = {
  zoneId: 5,
  eventList: [],
};

const NeidarTrails = {
  zoneId: 6,
  eventList: [
    {
      range: [1,100],
      name: "Zirkan's Woodsmen",
      isHidden: true,
      isImmediate: true,
      count: 12,
      isRepeatable: false,
    },
  ],
};

const NeidarKingdom = {
  zoneId: 7,
  eventList: [],
};

const ValleyOfClouds = {
  zoneId: 8,
  eventList: [],
};

const SouthernExit = {
  zoneId: 9,
  eventList: [],
};

const HoneyComb = {
  zoneId: 10,
  eventList: [],
};

const ColdCathedral = {
  zoneId: 11,
  eventList: [
    {
      range: [1,100],
      name: "Cliff",
      isHidden: true,
      isImmediate: false,
      count: 12,
      isRepeatable: false,
    },
  ],
};

const CrystalLake = {
  zoneId: 12,
  eventList: [],
};

const BridgeOfDirkan = {
  zoneId: 13,
  eventList: [],
};

const GlacialChute = {
  zoneId: 14,
  eventList: [],
};

const IceForest = {
  zoneId: 15,
  eventList: [],
};

const HighMountainBowls = {
  zoneId: 16,
  eventList: [],
};

const IceForest2 = {
  zoneId: 17,
  eventList: [],
};

const SnowPassage = {
  zoneId: 18,
  eventList: [],
};

const SouthernBowl = {
  zoneId: 19,
  eventList: [],
};

const HopefulVale = {
  zoneId: 20,
  eventList: [],
};

const WestBranch = {
  zoneId: 21,
  eventList: [],
};

const FallenForest = {
  zoneId: 22,
  eventList: [],
};

const BlackenedWood = {
  zoneId: 23,
  eventList: [],
};

const SouthRoad = {
  zoneId: 24,
  eventList: [],
};

const TheEyeOfElar = {
  zoneId: 25,
  eventList: [],
};

const WayOfTheWarrior = {
  zoneId: 26,
  eventList: [],
};

const WinterfruitGrove = {
  zoneId: 27,
  eventList: [],
};

const TrampledPlain = {
  zoneId: 28,
  eventList: [],
};

const HillsOfBlood = {
  zoneId: 29,
  eventList: [],
};

const BattlePlain = {
  zoneId: 30,
  eventList: [],
};

const TheBog = {
  zoneId: 31,
  eventList: [],
};

const Skullcap = {
  zoneId: 32,
  eventList: [],
};

export const ZoneEvents = {
  [IcePassage.zoneId]: IcePassage,
  [PaxTharkas.zoneId]: PaxTharkas,
};