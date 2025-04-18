import { nullEvent } from "../constants/events/constants.js";
import { luckEvents } from "../constants/events/luckEvents.js";
import { mountainEncounters } from "../constants/events/randomEncounters.js";
import { terrainEvents } from "../constants/events/terrainEvents.js";
import { ZoneEvents } from "../constants/events/zoneEvents.js";
import { artPath } from "../constants/paths.js";
import { isWithinNumberRange, rollWeighted } from "../helpers/math.js";
import { updateScene } from "../helpers/update.js";
import { registerWithSocketReady } from "../socket.js";
import { createForagingBounty } from "./foraging.js";
import { getCurrentHours, getGameClock } from "./gameClock.js";
import { getHexCrawlDataFromTile, getTileLocale, getTileZoneId, updateTileHexCrawlData } from "./tiles.js";

// const encounterChance = 417;
const encounterChance = 10000;

// Discovery
export const discoverTileActionName = 'discoverTile';
export const discoverTile = async (scene, tile, token) => {
  const { isDiscovered } = getHexCrawlDataFromTile(tile);
  if (isDiscovered) {
    return;
  }

  const LuckEvent = await getLuckEncounter(scene, tile, token);    
  let encounter = await getZoneEvent(scene, tile, token);    
  const terrainEvent = await getTerrainEvent(scene, tile, token);
  if (encounter.name === nullEvent.name) {
    encounter = getRandomEncounter(scene, token);
  }
  const forageEvent = await createForagingBounty(tile, token);
  
  const events = {
    terrain: cleanEvent(terrainEvent),
    encounter: cleanEvent(encounter),
    luck: cleanEvent(LuckEvent),
    forage: cleanEvent(forageEvent),
  };

  //update events for tile
  await updateTileHexCrawlData(tile, {
    events,
    isDiscovered: true,
  });
}

registerWithSocketReady(
  discoverTileActionName,
  discoverTile,
);

const cleanEvent = (event) => ({
  ...event,
  displayName: event.displayName ?? event.name,
});

// Zone Events
export const getZoneEvent = async (scene, tile, token) => {
  const zoneId = getTileZoneId(tile);
  const occurredEvents = getOccurredEvents(scene);
  const currentHours = getCurrentHours(token);
  const filterData = {
    occurredEvents,
    currentHours,
  };

  const roll = await new Roll("1d100", {}).roll();
  const event = (ZoneEvents[zoneId]?.eventList ?? [])
    .filter(event => passesFilters(
      { event, ...filterData },
      passesNonRepeatableEventFilter,
    ))
    .find(e => isWithinNumberRange(...e.range, roll.total))
  return {
    ...(event || { ...nullEvent }),
    icon: artPath('encounter.jpg')
  };
};

const passesLocaleEventFilter = ({ event, locales }) => locales.some(locale => event.locale.some(eventLocale => eventLocale === locale));

// Luck Events
const getLuckEncounter = async (scene, tile, token) => {
  const luckyChance = await rollRandomEncounterChance();
  if (!(luckyChance).needsEncounter) {
    return { ...nullEvent };
  }

  const locales = getTileLocale(tile);
  const occurredEvents = getOccurredEvents(scene);
  const currentHours = getCurrentHours(token);
  const filterData = {
    occurredEvents,
    currentHours,
    locales,
  };
  const events = luckEvents.filter(event => passesFilters(
    { event, ...filterData },
    passesNonRepeatableEventFilter,
    passesLocaleEventFilter,
  ));

  return {
    ...((await rollWeighted(events)) || { ...nullEvent }),
    icon: artPath('luck.jpg'),
  };
}

// Random Encounters
export const getRandomEncounter = async (scene, token) => {
  const { lastRandomCheck, currentHours } = getGameClock(token);
  const needsCheck = lastRandomCheck === null
    || (currentHours - lastRandomCheck) > 1;
  
  if (!needsCheck) {
    return { ...nullEvent };
  }

  const randomCheckResult = await rollRandomEncounterChance();

  if (!randomCheckResult.needsEncounter) {
    return { ...nullEvent };
  }

  const occurredEvents = getOccurredEvents(scene);
  const events = filterNonRepeatableEvents(mountainEncounters, occurredEvents, currentHours);

  const roll = await new Roll("1d100", {}).roll();
  const event = events.find(e => isWithinNumberRange(...e.range, roll.total));

  return {
    ...(event || { ...nullEvent }),
    icon: artPath('encounter.jpg'),
  };
};

// Terrain Events
const getTileTerrainEvent = (scene, tile) => scene.flags.hexCrawl?.terrainEvents?.[tile._id] ?? null;
const setTileTerrainEvent = async (scene, tile, event) => await updateScene(scene, {
  [`flags.hexCrawl.terrainEvents.${tile._id}`]: event,
});

const createTerrainEvent = async (scene, tile, token) => {
  const zoneId = getTileZoneId(tile);

  const terrainChanceResult = await rollRandomEncounterChance(zoneId);
  if (!terrainChanceResult.needsEncounter) {
    return {
      ...nullEvent,
    };
  }

  const locales = getTileLocale(tile);
  const occurredEvents = getOccurredEvents(scene);
  const currentHours = getCurrentHours(token);
  const filterData = {
    occurredEvents,
    currentHours,
    locales,
  };

  const events = terrainEvents.filter(event => passesFilters(
    { event, ...filterData },
    passesNonRepeatableEventFilter,
    passesLocaleEventFilter,
  ));

  return {
    ...((await rollWeighted(events)) || { ...nullEvent }),
    icon: artPath('terrain.jpg'),
  };
};

export const getTerrainEvent = async (scene, tile, token) => {  
  let terrainEvent = getTileTerrainEvent(scene, tile);
  if (!terrainEvent) {
    terrainEvent = await createTerrainEvent(scene, tile, token);
    await setTileTerrainEvent(scene, tile, terrainEvent);
  }
  return terrainEvent;
}



// Filters
const passesFilters = (eventData, ...filters) => filters.every(f => f(eventData));

const passesNonRepeatableEventFilter = ({
  event: { name, coolDown, lastOccurred, isRepeatable },
  occurredEvents,
  currentHours,
}) => {
  const hasOccurred = occurredEvents.some(oe => oe.name === name);
  const onCD = coolDown
    ? currentHours - lastOccurred < coolDown
    : false;

  return !hasOccurred
    || (isRepeatable && !onCD);
};

// Helpers
export const rollRandomEncounterChance = async (bonusPercent = 0) => {
  // All percentages are multiplied by 100 to work in the thousandths range.
  const roll = await new Roll(`1d10000 + ${bonusPercent * 100}`, {}).roll();
  const chance = encounterChance;

  return {
    chance,
    roll,
    needsEncounter: roll.total <= chance,
  };
};

const getOccurredEvents = (scene) => scene?.flags.hexCrawl?.occurredEvents ?? [];
