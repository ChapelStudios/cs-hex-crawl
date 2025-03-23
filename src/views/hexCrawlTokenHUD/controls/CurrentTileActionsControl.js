import { getTileByLocationActionName } from "../../../repos/tiles.js";
import { dl3HexCrawlSocket } from "../../../socket.js";
import { renderHexDetailInfo } from "../../hexInfo/HexInfo.js";

export const getCurrentTileActionsControl = (token, isOwner) => ({
  name: "open-hex-crawl-actions",
  title: "Open Actions for Current Hex",
  icon: "fa-solid fa-hexagon-image", // Font Awesome icon
  onclick: async (event) => {
    renderHexDetailInfo(await dl3HexCrawlSocket.executeAsGM(getTileByLocationActionName, canvas.scene, token), token);
  },
  visible: isOwner,
  section: 'right',
});