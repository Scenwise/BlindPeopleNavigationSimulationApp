export const getShortestPath = async (startNode:string, endNode:string) => {
    const response = await fetch(`http://159.223.223.232:8081/graphVertex/edgesShortestPath/159/${startNode}/${endNode}`, {
        method: "GET", // or "GET", "PUT", etc.
        headers: {
            "Content-Type": "application/geo+json",
            'Accept': '*/*'
        }
    });
    return await response.json();
}