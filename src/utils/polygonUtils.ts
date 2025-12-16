// Algoritmo Ray Casting per verificare se un punto è dentro un poligono
export interface Point {
  x: number
  y: number
}

export interface Polygon {
  points: Point[]
}

// Verifica se un punto è dentro un poligono usando ray casting algorithm
export const isPointInPolygon = (point: Point, polygon: Polygon): boolean => {
  const { x, y } = point
  const points = polygon.points
  let inside = false

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x
    const yi = points[i].y
    const xj = points[j].x
    const yj = points[j].y

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}

// Converte un rettangolo (x, y, width, height) a un poligono
export const rectangleToPolygon = (x: number, y: number, width: number, height: number): Polygon => {
  return {
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: height },
      { x, y: height }
    ]
  }
}

// Converte coordinate polygon HTML (array di valori alternati x,y) a Polygon
export const htmlPolygonToPolygon = (coords: number[]): Polygon => {
  const points: Point[] = []
  for (let i = 0; i < coords.length; i += 2) {
    points.push({ x: coords[i], y: coords[i + 1] })
  }
  return { points }
}
