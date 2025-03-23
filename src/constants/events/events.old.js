//import { isRandomEncounterCheckNeeded } from "../repos/gameClock.js";

const events = [
  {
    name: "Story Event",
    id: "story-test1",
    isForced: true,
    requiresDiscovery: false,
    location: [
      {
        x: 3328,
        y: 1885,
      },
    ],
  },
  {
    name: "Random Event",
    id: "rando-test1",
    location: [
      {
        x: 3328,
        y: 1885,
      },
      {
        x: 3200,
        y: 1885,
      },
    ],
  }
];

const isEventAtLocation = (event, location) => {
  if (event.location.length > 1) {
    const xs = event.location.map(point => point.x);
    const ys = event.location.map(point => point.y);
    
    return location.x <= Math.max(...xs)
      && location.x >= Math.min(...xs)
      && location.y >= Math.max(...ys)
      && location.y >= Math.min(...ys);
  }
  
  return location.x === event.location[0].x
    && location.y === event.location[0].y;
};

// export const getEventsForLocation = (location) => {
//   return events.filter(event => isEventAtLocation(event, location));
// };

// export const getRequiredEvents = (location, scene) => {
//   const localEvents  = getEventsForLocation(location);
//   const forcedEvents = localEvents.filter(event => event.isForced);
  
//   if (forcedEvents) {
//     return [forcedEvents[0]];
//   }

//   // // check for random encounter every 6 hours
//   // if (isRandomEncounterCheckNeeded(scene)) {

//   // }
// }