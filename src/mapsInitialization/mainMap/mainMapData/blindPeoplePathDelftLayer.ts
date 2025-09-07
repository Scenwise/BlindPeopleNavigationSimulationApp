import { Layer } from "mapbox-gl";

export const blindPeoplePathDelftLayer: Layer = {
    'id': 'route',
    'type': 'line',
    'source': 'blind-people-route-delft',
    'layout': {},
    'paint': {
        'line-color': '#F7455D',
        'line-width': 3
    }
}