import { Layer } from "mapbox-gl";

export const nodeLayer : Layer = {
        'id': 'nodes',
        'type': 'circle',
        'source': 'nodes-blind-people-network-delft',
        'layout': {},
        'paint': {
            'circle-radius': 6,
            'circle-color': [
                'case',
                ['boolean', ['feature-state', 'clicked'], false],
                '#007bff', // blue for clicked
                '#000000'  // default color
            ],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1
        }
    }