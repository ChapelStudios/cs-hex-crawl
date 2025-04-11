import { localeInfoLookup, localeTypes } from "../constants/moveCosts.js";
import { distanceBetweenPoints, snapMovementTo1 } from "../helpers/math.js";
import { updateToken } from "../helpers/update.js";
import { dl3HexCrawlSocket } from "../socket.js";
import { discoverTileActionName } from "./events.js";
import { adjustGameClock, getGameClock } from "./gameClock.js";
import { getTileByLocationActionName, getTileLocale, isHexCrawlTile } from "./tiles.js";

export const getTokenMoves = (token) => token.flags.hexCrawl?.currentMoveCount ?? 0;
export const getTokenDailyMoves = (token) => token.flags.hexCrawl?.movesPerDay ?? 0;
export const resetTokenMoves = async (token) => await updateToken(token, {
  ['flags.hexCrawl.currentMoveCount']: getTokenDailyMoves(token),
});
export const setTokenMoves = async (token, moveCount) => await updateToken(token, {
  ['flags.hexCrawl.currentMoveCount']: moveCount,
});

export const adjustCurrentMoves = async (token, adjustment, shouldAdvanceTime = true) => {
  if (adjustment === 0) {
    return;
  }
  
  const currentMoves = getTokenMoves(token);
  const remainingMoves = currentMoves + adjustment;
  if (remainingMoves < 0) {
    return null;
  }

  if (shouldAdvanceTime) {
    const timeCost = getNormalTokenMoveSpeed(token) * adjustment * -1;
    await adjustGameClock(token, timeCost);
  }

  return await updateToken(token, {
    ['flags.hexCrawl.currentMoveCount']: remainingMoves,
  });
};

export const getMoveCostFromLocale = (locale) => {
  if (!locale?.length) return 0;

  const costs = locale.map(l => localeInfoLookup[l]?.cost || 0);
  return Math.max(...costs);
}

// Movement Control Functions
export const getPreMoveInfo = (token) => token?.flags.hexCrawl?.turnStartLocation || {};
export const setPreMoveInfo = async (token, startingTile) => await updateToken(token, {
  ['flags.hexCrawl.turnStartLocation']: startingTile,
});

const doesTileGiveRoadBonus = (tile) => (tile?.flags.hexCrawl?.locale ?? []).includes(localeTypes.road);
export const doesTokenHaveRoadBonus = (token) => (token?.flags.hexCrawl?.roadBonus ?? 0) > 0;
const getTokenRoadBonus = (token) => token?.flags.hexCrawl?.roadBonus ?? 0;

const getNormalTokenMoveSpeed = (token) => token?.flags.hexCrawl?.movesDetails?.normal.speed ?? 0;

export const onTokenMove = async (scene, token, updates, options, userId) => {
  const gridSize = canvas.grid.size;
  const ogPosition = { x: token.x, y: token.y };
  
  // if either pos has changed handle updates
  if (
    (updates.x !== undefined && updates.x !== ogPosition.x)
    || (updates.y !== undefined && updates.y !== ogPosition.y)
  ) {
    const updatedPosition = {
      x: updates.x ?? ogPosition.x,
      y: updates.y ?? ogPosition.y,
    };
    const tokenGridPos = canvas.grid.getSnappedPosition(updatedPosition.x, updatedPosition.y);
    const movementDistance = distanceBetweenPoints(ogPosition.x, ogPosition.y, tokenGridPos.x, tokenGridPos.y);
    const snappedPosition = snapMovementTo1(ogPosition.x, ogPosition.y, tokenGridPos.x, tokenGridPos.y, gridSize);

    // when we await this, the update will process and we need to manually perform any updates after this
    const postMoveTile = await dl3HexCrawlSocket.executeAsGM(getTileByLocationActionName, scene, snappedPosition);
    if (!isHexCrawlTile(postMoveTile)) {
      return null;
    }

    // If the token moves more than one hex, snap to one hex distance
    if (movementDistance > gridSize) {
      // Allow the GM to move the token around without effecting game play
      // ToDo: allow the gm to move 1 as well and instead ask gm if tile should be discovered.
      if (movementDistance > (gridSize * 2) && game.user.isGM) {
        return null;
      }
      updates.x = snappedPosition.x;
      updates.y = snappedPosition.y;
    }

    // handle move cost
    // ToDo: when using the road bonus you should actually pay this:
    const { cost, newRoadBonus } = getMoveCost(postMoveTile, token);
    const remainingMoves = getTokenMoves(token) - cost;

    if (remainingMoves < 0) {
      ui.notifications.warn("Not enough moves to move there!");
      // Cancel move
      updates.x = ogPosition.x;
      updates.y = ogPosition.y;

      if (!game.user.isGM) {
        await updateToken(token, updates);
      }
      return null; // Prevent further updates
    }
    
    updates['flags.hexCrawl.currentMoveCount'] = remainingMoves;
    updates['flags.hexCrawl.roadBonus'] = newRoadBonus;

    // handle time cost
    const timeCost = getNormalTokenMoveSpeed(token) * cost;
    updates['flags.hexCrawl.gameClock.currentHours'] = (getGameClock(token)?.currentHours ?? 0) + timeCost;

    // discover tile discoverTileActionName
    await dl3HexCrawlSocket.executeAsGM(discoverTileActionName, scene, postMoveTile, token);

    await updateToken(token, updates);

    return postMoveTile;
  }
};

export const getMoveCost = (tile, token) => {
  const hasRoadBonus = doesTokenHaveRoadBonus(token);
  const isNewTileRoad = doesTileGiveRoadBonus(tile);
  const oldCost = getTokenRoadBonus(token);
  const newCost = getMoveCostFromLocale(getTileLocale(tile));
  const cost = hasRoadBonus && isNewTileRoad
    ? Math.floor((newCost + oldCost) / 2) - oldCost
    : newCost;

  return {
    cost,
    newRoadBonus: !hasRoadBonus && isNewTileRoad
      ? newCost
      : 0,
    normalCost: newCost,
  };
};