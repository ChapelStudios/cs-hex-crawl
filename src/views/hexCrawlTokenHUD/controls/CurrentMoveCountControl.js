import { getTokenMoves, setTokenMoves } from "../../../repos/moves.js";


export const getCurrentMoveCountControl = (token) => ({
  name: "current-move-count",
  title: "Current Move Count",
  icon: "fas fa-arrows-alt", // Custom icon
  visible: true,
  value: getTokenMoves(token),
  editable: game.user.isGM, // Only editable by GMs
  max: 100,
  step: 1,
  section: 'right',
  onchange: async (event) => {
      event.preventDefault();
      if (!game.user.isGM) {
        ui.notifications.error("Only the GM can edit the move count.");
        return;
      }
      const newValue = parseInt(event.target.value);
      await setTokenMoves(token, newValue);
  },
  class: "elevation",
});