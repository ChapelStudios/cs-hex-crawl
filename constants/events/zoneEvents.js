
const PaxTharkas = {
  zoneId: 1,
  eventList: [
    {
      range: [1,100],
      name: "Enter Pax Tharkas",
      isImmediate: true,
      count: "1d8",
      isRepeatable: true,
      coolDown: 12,
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

export const ZoneEvents = {
  [IcePassage.zoneId]: IcePassage,
  [PaxTharkas.zoneId]: PaxTharkas,
};