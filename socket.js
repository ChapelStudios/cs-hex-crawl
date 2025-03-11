import { skillCheckSocketConfig } from "./helpers/entityTools.js";
import { eventsSocketConfig } from "./repos/events.js";
import { foragingSocketConfig } from "./repos/foraging.js";
import { settingsSocketConfig } from "./repos/gameSettings.js";
import { provisionsSocketConfig } from "./repos/provisions.js";
import { tilesSocketConfig } from "./repos/tiles.js";

export let dl3HexCrawlSocket = null;

export const registerSocketModule = () => {
  if (!dl3HexCrawlSocket) {
    dl3HexCrawlSocket = socketlib.registerModule('cs-hex-crawl');
  }
}

export const dl3HexCrawlSocketInit = () => {
  Hooks.once("socketlib.ready", () => {
    registerSocketModule();

    foragingSocketConfig(dl3HexCrawlSocket);
    tilesSocketConfig(dl3HexCrawlSocket);
    settingsSocketConfig(dl3HexCrawlSocket);
    eventsSocketConfig(dl3HexCrawlSocket);
    provisionsSocketConfig(dl3HexCrawlSocket);
    skillCheckSocketConfig(dl3HexCrawlSocket);
  });
}

export const executeForActorsAsync = async (functionToExecute, actorIds, ...functionArgs) => {
  const results = await Promise.all(
    actorIds.map(async actorId => {
      const actor = game.actors.get(actorId);
      const ownerId = await findOwnerOfActor(actor);
      return {
        [actor.id]: !!ownerId
          ? await dl3HexCrawlSocket.executeAsUser(functionToExecute, ownerId, actor, ...functionArgs)
          : await dl3HexCrawlSocket.executeAsGM(functionToExecute, actor, ...functionArgs)
      };
    })
  );

  // Merge all results into a single object
  return results.reduce((acc, result) => ({ ...acc, ...result }), {});
};

// not til 12
// const entityOwner = CONST.ENTITY_PERMISSIONS.OWNER;
const entityOwner = 3;

async function findOwnerOfActor(actor) {
  // Get the users who own the actor
  const owners = Object.entries(actor.data.permission)
    .filter(([userId, perm]) => perm >= entityOwner)
    .map(([userId, perm]) => game.users.get(userId))
    .filter(user => user && !user.isGM && user.active);

  // Return the id of the first owner found or null if none are found
  return owners.length > 0 ? owners[0].id : null;
}
