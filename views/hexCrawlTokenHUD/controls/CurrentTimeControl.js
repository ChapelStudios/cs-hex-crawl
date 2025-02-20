import { convertHoursToDaysAndHours, convertToHoursAndMinutes } from "../../../helpers/math.js";
import { getGameClock, setGameClock } from "../../../repos/gameClock.js";


export const getCurrentTimeControl = (token) => ({
  name: "cs-hex-current-time",
  title: "Current Time",
  //icon: "fas fa-arrows-alt", // Custom icon
  visible: true,
  value: convertToHoursAndMinutes(convertHoursToDaysAndHours(getGameClock(token).currentHours).hours),
  editable: game.user.isGM, // Only editable by GMs
  max: 100,
  step: 1,
  section: 'left',
  onchange: async (event) => {
      event.preventDefault();
      if (!game.user.isGM) {
        ui.notifications.error("Only the GM can edit the move count.");
        return;
      }
      const newValue = parseInt(event.target.value);
      await setGameClock(token, {
        currentHours: newValue
      });
  },
});