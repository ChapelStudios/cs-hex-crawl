const defaultTile = Object.freeze({
  events: {
    terrain: null,
    encounter: null,
    luck: null,
    forage: null,
  },
  locale: [],
  zoneId: 0,
  hasCheckedEvents: false,
  x: 0,
  y: 0,
});

export const nullTileId = "None";

// const getKnownTiles = (scene) => scene.tiles._source.filter(t => !!t.flags.hexCrawl) || [];
export const updateTileHexCrawlData = async (tile, updateData, isConfig = false) =>  await tile.update({
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
});

export const isHexCrawlTile = (tile) => !!tile?.flags.hexCrawl;

export const getHexCrawlDataFromTile = (tile) => ({
  ...defaultTile,
  ...(tile?.flags.hexCrawl ?? {}),
});

export const resetEventsForAllTiles = async (scene) => {
  const jobs = [];

  for (const tile of scene.tiles) {
    if (isHexCrawlTile(tile)) {
      jobs.push(updateTileHexCrawlData(tile, {
        events: defaultTile.events,
        hasCheckedEvents: false,
      }));
    }
  }

  await Promise.all(jobs);
}

export const getTileZoneId = (tile) => getHexCrawlDataFromTile(tile).zoneId;
export const getTileLocale = (tile) => getHexCrawlDataFromTile(tile).locale;
export const getTileEvents = (tile) => getHexCrawlDataFromTile(tile).events;

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
export const setKnownTileByLocationId = async (locationId, tileId) => {
  await canvas.scene?.update({
    [`flags.hexCrawl.knownTileLocations.${locationId}`]: tileId,
  });
};


