export let dl3HexCrawlSocket = null;

export const registerSocketModule = () => {
  if (!dl3HexCrawlSocket) {
    dl3HexCrawlSocket = socketlib.registerModule('cs-hex-crawl');
  }
}

export const notifyGmWarningActionName = "notifyGmWarning";
export const SOCKET_READY = "cs-hc-socketReady";

export const dl3HexCrawlSocketInit = () => {
  Hooks.once("socketlib.ready", () => {
    registerSocketModule();

    // Trigger your custom hook after initializing the socket
    Hooks.callAll(SOCKET_READY, dl3HexCrawlSocket);
  });
};

export const registerWithSocketReady = (actionName, callback) => {
  Hooks.on(SOCKET_READY, (socket) => {
    socket.register(actionName, callback);
  });
};

export const executeForActorsAsync = async (functionToExecute, actorIds, ...functionArgs) => {
  const results = await Promise.all(
    actorIds.map(async actorId => {
      const actor = game.actors.get(actorId);
      const ownerId = await findOwnerOfActor(actor.id);
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

async function findOwnerOfActor(actorId) {
  // Get the users who own the actor
  const user = game.users._source.find(user => user.character === actorId);
  return user?._id ?? null;
}
