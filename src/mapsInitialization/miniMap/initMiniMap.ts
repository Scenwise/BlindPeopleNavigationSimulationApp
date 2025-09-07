import { Map } from "mapbox-gl";

export const initMiniMap = (lng: number, lat: number, mapStyle: string, zoom: number, miniMapContainer: React.MutableRefObject<HTMLDivElement | null>): Map => {
    return new Map({
                container: miniMapContainer.current as string | HTMLElement,
                style: 'mapbox://styles/mapbox/' + mapStyle,
                center: [lng, lat], //coordinates for Delft Station
                zoom: zoom-2,
                interactive: false,
                attributionControl: false,
                pitch: 30,
                bearing: -20
            })
}