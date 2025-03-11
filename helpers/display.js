export const replaceActorIdsWithNames = async (forageCheckResults) => {
  if (!forageCheckResults) {
    return {};
  }

  // Helper function to get actor name by ID
  async function getActorNameById(actorId) {
    const actor = game.actors.get(actorId);
    return actor ? actor.name : actorId;
  }

  // Replace leadForager
  const leadForagerName = await getActorNameById(forageCheckResults.leadForager);

  // Replace assists
  const assistNames = await Promise.all(forageCheckResults.assists.map(getActorNameById));

  // Replace useless
  const uselessNames = await Promise.all(forageCheckResults.useless.map(getActorNameById));

  // Return the new object with names, using the spread operator
  return {
    ...forageCheckResults,
    leadForager: leadForagerName,
    assists: assistNames.join(", "),
    useless: uselessNames.join(", "),
  };
};

export const registerPartial = (filePath, partialName) => {
  fetch(filePath)
    .then(response => response.text())
    .then(templateContent => {
      Handlebars.registerPartial(partialName, templateContent);
    })
    .catch(error => console.error(`Error loading partial ${partialName}:`, error));
};