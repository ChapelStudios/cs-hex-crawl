export const updateToken = async (token, updateData, options = {}) => {
  if (typeof token?.update !== 'function') {
    token = canvas.tokens.get(token?._id)?.document;
  }

  return await token?.update(updateData, options);
};

export const updateScene = async (scene, updateData, options = {}) => {
  if (typeof scene?.update !== 'function') {
    scene = game.scenes.get(scene?._id);
  }

  return await scene?.update(updateData, options);
};

export const updateActor = async (actor, updateData, options = {}) => {
  if (typeof actor?.update !== 'function') {
    actor = game.actors.get(actor?._id);
  }

  return await actor?.update(updateData, options);
};

export const updateTile = async (tile, updateData, options = {}) => {
  if (typeof tile?.update !== 'function') {
    tile = canvas.scene.tiles.get(tile._id);
  }

  return await tile?.update(updateData, options);
};