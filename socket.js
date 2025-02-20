import { foragingSocketConfig } from "./repos/foraging.js";
import { getTileByLocation } from "./repos/tiles.js";

// export let dl3HexCrawlSocket;
export let dl3HexCrawlSocket = null;

export const registerSocketModule = () => {
  if (!dl3HexCrawlSocket) {
    dl3HexCrawlSocket = socketlib.registerModule('cs-hex-crawl');
  }
}

export const dl3HexCrawlSocketInit = () => {
  Hooks.once("socketlib.ready", () => {
    registerSocketModule();

    dl3HexCrawlSocket.register('getTileByLocation', getTileByLocation);
    foragingSocketConfig(dl3HexCrawlSocket);
  });
}

export const executeForActorsAsync = async (functionToExecute, actors, ...functionArgs) => await actors.reduce(
  async (result, actor) => {
    const ownerId = await findOwnerOfActor(actor);
    result[actor.id] = !!ownerId
      ? await dl3HexCrawlSocket.executeAsUser(functionToExecute, actor.id, actor, ...functionArgs)
      : await dl3HexCrawlSocket.executeAsGM(functionToExecute, actor, ...functionArgs);
    return result;
  }, {}
);

// not til 12
// const entityOwner = CONST.ENTITY_PERMISSIONS.OWNER;
const entityOwner = 3;

async function findOwnerOfActor(actor) {
  // Get the actor by id
  // const actor = game.actors.get(actorId);
  // if (!actor) {
  //   return null;
  // }

  // Get the users who own the actor
  const owners = Object.entries(actor.data.permission)
    .filter(([userId, perm]) => perm >= entityOwner)
    .map(([userId, perm]) => game.users.get(userId))
    .filter(user => user && !user.isGM && user.active);

  // Return the id of the first owner found or null if none are found
  return owners.length > 0 ? owners[0].id : null;
}
