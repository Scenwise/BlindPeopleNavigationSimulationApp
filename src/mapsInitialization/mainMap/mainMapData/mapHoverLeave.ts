import { Popup } from "mapbox-gl";
import { Map } from "mapbox-gl";

export const mouseHoverLeave = (map: Map, popup: Popup) => {
    map.getCanvas().style.cursor = '';
    popup.remove();
}