export const controlTokenIfNotAlready = (tokenId) => {
  // Get the controlled tokens array
  const controlledTokens = canvas.tokens.controlled;

  // Check if the token ID is already controlled
  const tokenExists = controlledTokens.some(token => token.id === tokenId);

  // If not, add the token to the controlled list
  if (!tokenExists) {
    const tokenToAdd = canvas.tokens.get(tokenId);
    if (tokenToAdd) {
      tokenToAdd.control({ releaseOthers: false });
      console.log(`Token with ID ${tokenId} has been added to the controlled tokens.`);
    } else {
      console.warn(`Token with ID ${tokenId} does not exist on the canvas.`);
    }
  } else {
    console.log(`Token with ID ${tokenId} is already controlled.`);
  }
};