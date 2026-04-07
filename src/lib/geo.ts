const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const dPhi = toRadians(lat2 - lat1);
  const dLambda = toRadians(lng2 - lng1);
  const insideRoot =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(insideRoot));
}

