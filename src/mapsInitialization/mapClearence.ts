import { Map } from "mapbox-gl"

export const clearMapSourceAndLayer = (source: string, layer: string, map: Map|null) => {
    if(map?.getSource(source) && map?.isSourceLoaded(source)){
            map?.removeLayer(layer)
            map?.removeSource(source)
        }
}