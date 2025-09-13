import { Layer } from "mapbox-gl";

export const networkLayer: Layer = {
        'id': 'network',
        'type': 'line',
        'source': 'blind-people-network-delft',
        'layout': {},
        'paint': {
            'line-color': '#000',
            'line-width': 3
        }
    }