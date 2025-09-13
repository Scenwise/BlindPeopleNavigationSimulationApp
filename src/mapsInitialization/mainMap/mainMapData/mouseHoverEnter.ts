import { InteractionEvent, Popup, Map } from "mapbox-gl";

export const mouseHoverEnter = (e: InteractionEvent, map: Map, popup: Popup) => {
        map.getCanvas().style.cursor = 'pointer';

        // Copy the coordinates from the POI underneath the cursor
    
        const idNode = e.feature?.properties?.id as string;

        // Populate the popup and set its coordinates based on the feature found.
        popup
            .setLngLat(e.lngLat)
            .setHTML(`<span id=${idNode} >${idNode}, ${e.lngLat}</span>`)
            .addTo(map);
        }