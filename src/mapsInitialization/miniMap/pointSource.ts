import { SourceSpecification } from "mapbox-gl";


export const pointSource = (coordinates: [number, number]) : SourceSpecification => {
    return {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: coordinates // starting position
                        },
                        properties:{}
                    }
                ]
            }
        }
}