import { FeatureCollection } from "geojson";
import { SourceSpecification } from "mapbox-gl";


export const blindPeopleNetworkDelft = (blindPeoplePath: FeatureCollection): SourceSpecification => {
    return {
        type: 'geojson',
        data: blindPeoplePath,
        generateId: true 
    }
}

export const blindPeopleRouteDelft = (blindPeoplePath: FeatureCollection): SourceSpecification => blindPeopleNetworkDelft(blindPeoplePath);