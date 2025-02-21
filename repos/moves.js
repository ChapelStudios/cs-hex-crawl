import { localeInfoLookup, localeTypes } from "../constants/moveCosts.js";
import { distanceBetweenPoints, snapMovementTo1 } from "../helpers/math.js";
import { renderHexDetailInfo } from "../views/hexInfo/HexInfo.js";
import { discoverTile } from "./events.js";
import { getGameClock } from "./gameClock.js";
import { getTileByLocation, getTileLocale, isHexCrawlTile } from "./tiles.js";

export const getTokenMoves = (token) => token.flags.hexCrawl?.currentMoveCount ?? 0;
export const getTokenDailyMoves = (token) => token.flags.hexCrawl?.movesPerDay ?? 0;
export const resetTokenMoves = async (token) => await token.update({
  ['flags.hexCrawl.currentMoveCount']: getTokenDailyMoves(token),
});
export const setTokenMoves = async (token, moveCount, isAdjustment = false) => await token.update({
  ['flags.hexCrawl.currentMoveCount']: moveCount,
});

export const adjustCurrentMoves = async (token, adjustment) => {
  const currentMoves = getTokenMoves(token);
  const remainingMoves = currentMoves + adjustment;
  if (remainingMoves < 0) {
    return null;
  }

  return await token.update({
    ['flags.hexcrawl.currentMoveCount']: remainingMoves,
  });
};

export const getMoveCostFromLocale = (locale) => {
  if (!locale?.length) return 0;

  const costs = locale.map(l => localeInfoLookup[l]?.cost || 0);
  return Math.max(...costs);
}

// Movement Control Functions
export const getPreMoveInfo = (token) => token?.flags.hexCrawl?.turnStartLocation || {};
export const setPreMoveInfo = async (token, startingTile) => await token.update({
  ['flags.hexCrawl.turnStartLocation']: startingTile,
});

// export const beforeTokenMove = async (token, updates, options, userId) => {
//   const premoveTile = await getTileByLocation(canvas.scene, token);
//   updates['flags.hexCrawl.turnStartLocation'] = {
//     ...getHexCrawlDataFromTile(premoveTile),
//     x: token.x,
//     y: token.y,
//   };
// }

const doesTileGiveRoadBonus = (tile) => (tile?.flags.hexCrawl?.locale ?? []).includes(localeTypes.road);
const doesTokenHaveRoadBonus = (token) => token?.flags.hexCrawl?.hasRoadBonus ?? false;

const getNormalTokenMoveSpeed = (token) => token?.flags.hexCrawl?.movesDetails?.normal.speed ?? 0;

export const onTokenMove = async (scene, token, updates, options, userId) => {
  const gridSize = canvas.grid.size;
  
  // if either pos has changed handle updates
  if (
    (updates.x !== undefined && updates.x !== token.x)
    || (updates.y !== undefined && updates.y !== token.y)
  ) {
    const updatedPosition = {
      x: updates.x ?? token.x,
      y: updates.y ?? token.y,
    };
    const tokenGridPos = canvas.grid.getSnappedPosition(updatedPosition.x, updatedPosition.y);
    const movementDistance = distanceBetweenPoints(token.x, token.y, tokenGridPos.x, tokenGridPos.y);
    const snappedPosition = snapMovementTo1(token.x, token.y, tokenGridPos.x, tokenGridPos.y, gridSize);

    // if token didn't more to a hexCrawlTile do nothing
    const postMoveTile = await getTileByLocation(scene, snappedPosition);
    if (!isHexCrawlTile(postMoveTile)) {
      return;
    }

    // If the token moves more than one hex, snap to one hex distance
    if (movementDistance > gridSize) {
      // Allow the GM to move the token around without effecting game play
      // ToDo: allow the gm to move 1 as well and instead ask gm if tile should be discovered.
      if (movementDistance > (gridSize * 2) && game.user.isGM) {
        return;
      }
      updates.x = snappedPosition.x;
      updates.y = snappedPosition.y;
    }

    // handle move cost
    // ToDo: when using the road bonus you should actually pay this:
    // ((premoveTile.cost + postMoveTile.cost) / 2) - premoveTile.cost
    // ToDo: extract this so it can also be used in the mouseover Preview Tool (HexBasicInfo)
    const hasRoadBonus = doesTokenHaveRoadBonus(token);
    const isNewTileRoad = doesTileGiveRoadBonus(postMoveTile);
    const cost = hasRoadBonus && isNewTileRoad
      ? 0
      : getMoveCostFromLocale(getTileLocale(postMoveTile));
    const remainingMoves = getTokenMoves(token) - cost;

    if (remainingMoves < 0) {
      // Cancel move
      updates.x = token.x;
      updates.y = token.y;

      // await token.update(updates);
      return; // Prevent further updates
    }
    
    updates['flags.hexCrawl.currentMoveCount'] = remainingMoves;
    updates['flags.hexCrawl.hasRoadBonus'] = !hasRoadBonus && isNewTileRoad;

    // handle time cost
    const timeCost = getNormalTokenMoveSpeed(token) * cost;
    updates['flags.hexCrawl.gameClock.currentHours'] = (getGameClock(token)?.currentHours ?? 0) + timeCost;

    // discover tile
    await discoverTile(scene, postMoveTile, token);

    // display hex actions info app
    await renderHexDetailInfo(postMoveTile, token);

    // await token.update(updates);
    // return false; // Prevent further updates
  }
};