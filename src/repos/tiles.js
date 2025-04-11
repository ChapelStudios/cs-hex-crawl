import { defaultForageEvent, nullEvent, nullTileId } from "../constants/events/constants.js";
import { updateTile } from "../helpers/update.js";
import { registerWithSocketReady } from "../socket.js";

const defaultTile = Object.freeze({
  events: {
    terrain: { ...nullEvent },
    encounter: { ...nullEvent },
    luck: { ...nullEvent },
    forage: { ...defaultForageEvent },
  },
  locale: [],
  zoneId: 0,
  isDiscovered: false,
  x: 0,
  y: 0,
});

// const getKnownTiles = (scene) => scene.tiles._source.filter(t => !!t.flags.hexCrawl) || [];
export const updateTileHexCrawlData = async (tile, updateData, isConfig = false) =>  updateTile(
  tile,
  {
    [`flags.hexCrawl`]: {
      ...(tile.flags.hexCrawl ?? {}),
      ...(isConfig ? {
        //initComplete: true,
      } : {}),
      ...updateData,
    },
    ...(isConfig ? {
      hidden: true,
      locked: true,
    } : {}),
  },
  { diff: false }
);

export const updateForageDataActionName = 'updateForageData';
export const updateForageData = async (tile, forageEvent) => updateTile(tile, {
  [`flags.hexCrawl.events.forage`]: forageEvent,
}, { diff: false });

export const isHexCrawlTile = (tile) => !!tile?.flags.hexCrawl;

export const getHexCrawlDataFromTile = (tile) => ({
  ...defaultTile,
  ...(tile?.flags.hexCrawl ?? {}),
});

export const resetEventsForAllTiles = async () => {
  ui.notifications.info("Beginning tile reset.");
  const jobs = [];

  for (const { document } of canvas.tiles.tiles) {
    if (isHexCrawlTile(document)) {
      jobs.push(updateTileHexCrawlData(document, {
        events: { ...defaultTile.events },
        isDiscovered: false,
      }));
    }
  }

  await Promise.all(jobs);
  ui.notifications.info("Tile reset complete.");
}

export const getTileZoneId = (tile) => getHexCrawlDataFromTile(tile).zoneId;
export const getTileLocale = (tile) => getHexCrawlDataFromTile(tile).locale;
export const getTileEvents = (tile) => getHexCrawlDataFromTile(tile).events;
export const hasTileBeenDiscovered = (tile) => getHexCrawlDataFromTile(tile)?.isDiscovered;

export const getTileByLocation = async (scene, location) => {
  const locationId = makeLocationId(location);
  const existing = getTileByLocationId(locationId);

  if (existing) {
    return existing;
  }

  const found = scene.tiles.find(tile => tile.x === location.x && tile.y === location.y);
  const tileId = !!found && isHexCrawlTile(found)
    ? found?._id
    : nullTileId;
  await setKnownTileByLocationId(locationId, tileId);

  return found || null;
};

const makeLocationId = ({x, y}) => `${x},${y}`;
export const getTileByLocationId = (locationId) => {
  const tileId = canvas.scene?.flags.hexCrawl?.knownTileLocations?.[locationId];

  if (!tileId || tileId === nullTileId) {
    return null;
  }

  return canvas.scene?.tiles.get(tileId);
};

export const getTileByLocationActionName = 'getTileByLocation';
export const setKnownTileByLocationId = async (locationId, tileId) => await canvas.scene?.update({
  [`flags.hexCrawl.knownTileLocations.${locationId}`]: tileId,
});

registerWithSocketReady(
  getTileByLocationActionName,
  getTileByLocation,
);
registerWithSocketReady(
  updateForageDataActionName,
  updateForageData,
);