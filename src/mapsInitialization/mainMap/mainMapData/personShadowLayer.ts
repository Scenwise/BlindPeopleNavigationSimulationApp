import { Layer } from "mapbox-gl";

export const personShadowLayer: Layer = {
    id: 'person-shadow-layer',
    type: 'circle',
    source: 'person-shadow',
    paint: {
        "circle-radius": 20,          // size of shadow (in pixels)
        "circle-color": "black",
        "circle-opacity": 0.8,        // transparency
        "circle-blur": 0.6            // soft edges
    }
}