import { CampActions } from "./CampActions.js";
import { getPartyMemberList } from "../../repos/gameSettings.js";
import { getCurrentDay } from "../../repos/gameClock.js";

// Function to show a dialog for selecting an actor
const showActorSelectionDialog = (partyMembers) => {
  return new Promise((resolve) => {
    new Dialog({
      title: "Select Actor for Camp Actions",
      content: `
        <form>
          <div class="form-group">
            <label for="actor-select">Choose an Actor:</label>
            <select id="actor-select" name="actor">
              ${partyMembers
                .map(
                  (actor) =>
                    `<option value="${actor.id}">${actor.name}</option>`
                )
                .join("")}
            </select>
          </div>
        </form>
      `,
      buttons: {
        confirm: {
          label: "Confirm",
          callback: (html) => {
            const actorId = html.find("#actor-select").val();
            resolve(actorId);
          },
        },
        cancel: {
          label: "Cancel",
          callback: () => {
            resolve(null);
          },
        },
      },
      default: "confirm",
    }).render(true);
  });
};

export const launchCampActions = async (scene, token) => {
  // Get the actor assigned to the user by default.
  const assignedActor = game.actors.get(game.user.character?.id);

  // If no assigned actor and user is GM, prompt for selection.
  if (!assignedActor && game.user.isGM) {
    const partyMembers = getPartyMemberList();

    if (!partyMembers || partyMembers.length === 0) {
      ui.notifications.warn("No party members available to select.");
      return false;
    }

    // Show dialog to select an actor.
    const actorId = await showActorSelectionDialog(partyMembers);
    if (!actorId) {
      ui.notifications.error("No valid actor selected.");
      return false;
    }
    const selectedActor = game.actors.get(actorId);
    const campActionsManager = new CampActions(scene, {
      assignedActor: selectedActor,
      currentDay: getCurrentDay(token),
    }).render(true);
    return campActionsManager;
  }

  // If an actor is already assigned or the user is not a GM, proceed as normal.
  if (!assignedActor) {
    ui.notifications.error("You must be assigned an actor to use Camp Actions.");
    return false;
  }

  const campActionsManager = new CampActions(scene, {
    assignedActor,
    currentDay: getCurrentDay(token),
  }).render(true);
  return campActionsManager;
};
