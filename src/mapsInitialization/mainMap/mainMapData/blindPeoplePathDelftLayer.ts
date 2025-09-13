import { Layer } from "mapbox-gl";

export const blindPeoplePathDelftLayer: Layer = {
    'id': 'route',
    'type': 'line',
    'source': 'blind-people-route-delft',
    'layout': {},
    'paint': {
        // Set line color based on feature property
        'line-color': [
            'case',
            ['==', ['get', 'imaginery_content'], 'yes'], // if imaginery_content is 'yes'
            '#FFFFFF', // blue
            '#F7455D'  // else red
        ],
        // Set line dash based on feature property
        'line-dasharray': [
            'case',
            ['==', ['get', 'imaginery_content'], 'yes'],
            [2, 4],  // dotted line
            [1, 0]   // solid line
        ],
        'line-width': 3
    }
}