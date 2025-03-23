import { isActorInParty, isCampToken } from "../../../repos/gameSettings.js";
import { launchCampActions } from "../../campActions/campActionsLauncher.js";

export const getOpenCampActionsControl = (token) => ({
  name: "open-hex-crawl-camp-actions",
  title: "Open Actions for Current Hex",
  icon: "fa-solid fa-campfire", // Font Awesome icon
  onclick: async (event) => {
    launchCampActions(canvas.scene, token);
  },
  visible: isCampToken(token) && (game.user.isGM || isActorInParty(game.actors.get(game.user.character?._id), token)),
  section: 'left',
});