import { Layer } from "mapbox-gl";

export const miniTriangleLayer= (bearing : number): Layer => {
    return {
            id: 'mini-triangle-layer',
            type: 'symbol',
            source: 'mini-triangle',
            layout: {
                'icon-image': 'mini-triangle-icon',
                'icon-size': 1, // smaller than big map
                'icon-rotate': bearing, // align with direction
                'icon-rotation-alignment': 'map'
            }
        }
} 