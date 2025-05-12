import { MapContext } from "@/components/ui/maps-context";
import { Layer } from "@deck.gl/core";
import { PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import React, { createContext, ReactNode, useContext, useState } from "react";

// Type for a polygon (array of points)
type Point = [number, number];
type Polygon = Point[];

// MetricLayerType enum
export type MetricLayerType = 
  | "areaCoverage" 
  | "carbonStock" 
  | "forestGrowth" 
  | "leakage" 
  | "netSequestration" 
  | "marketableCredits"

// Interface for the carbon metrics data
export interface CarbonMetricsData {
  area: number;
  carbonStocks: number;
  forestGrowth: number;
  leakage: number;
  netSequestration: number;
  marketableCredits: number;
}

// Interface for metric layer info
export interface MetricLayerInfo {
  id: MetricLayerType;
  name: string;
  color: number[]; // RGBA values
  visible: boolean;
}

// Drawing context interface (partial)
interface DrawingContextType {
  drawingMode: boolean;
  startDrawingMode: () => void;
  endDrawingMode: () => void;
  handleMapClick: (info: any) => void;
  getDrawingLayers: () => Layer[];
  getDrawnArea: () => Polygon | null;
  calculateArea: (polygon: Polygon | null) => number;
  clearDrawings: () => void;
  // Carbon metrics properties
  carbonMetrics: CarbonMetricsData | null;
  // Multiple layer visibility control
  metricLayers: MetricLayerInfo[];
  toggleMetricLayer: (layerId: MetricLayerType) => void;
  setAllMetricLayers: (visible: boolean) => void;
}
// Create context for drawing functionality
export const DrawingContext = createContext<DrawingContextType | null>(null);

interface DrawingProviderProps {
  children: ReactNode;
}

export const DrawingProvider: React.FC<DrawingProviderProps> = ({ children }) => {
  const mapContext = useContext(MapContext);
  const [drawingMode, setDrawingMode] = useState<boolean>(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [finishedPolygons, setFinishedPolygons] = useState<Polygon[]>([]);
  const [carbonMetrics, setCarbonMetrics] = useState<CarbonMetricsData | null>(null);
  
  // Initialize metric layers with visibility states
  const [metricLayers, setMetricLayers] = useState<MetricLayerInfo[]>([
    { id: "areaCoverage", name: "Area Coverage", color: [0, 128, 255, 150], visible: true },
    { id: "carbonStock", name: "Carbon Stock Baseline", color: [0, 200, 0, 130], visible: true },
    { id: "forestGrowth", name: "Forest Growth", color: [0, 255, 0, 110], visible: true },
    { id: "leakage", name: "Leakage Risk", color: [255, 100, 0, 110], visible: true },
    { id: "netSequestration", name: "Net Sequestration", color: [50, 200, 150, 120], visible: true },
    { id: "marketableCredits", name: "Marketable Credits", color: [120, 80, 200, 140], visible: true },
  ]);
  
  // Function to toggle an individual metric layer
  const toggleMetricLayer = (layerId: MetricLayerType): void => {
    setMetricLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible } 
          : layer
      )
    );
  };
  
  // Function to set all layers' visibility at once
  const setAllMetricLayers = (visible: boolean): void => {
    setMetricLayers(prevLayers => 
      prevLayers.map(layer => ({ ...layer, visible }))
    );
  };
  
  // Start drawing mode
  const startDrawingMode = (): void => {
    setDrawingMode(true);
    setCurrentPoints([]);
  };

  // End drawing mode
  const endDrawingMode = async (): Promise<void> => {
  if (currentPoints.length >= 3) {
    // Only save polygon if it has at least 3 points
    const newPolygon = [...currentPoints];
    setFinishedPolygons([...finishedPolygons, newPolygon]);
    
    // Set loading state if you have one
    // setIsLoading(true);
    
    // Calculate carbon metrics based on GeoJSON data
    try {
      const metrics = await calculateCarbonMetrics(newPolygon);
      setCarbonMetrics(metrics);
    } catch (error) {
      console.error('Error calculating metrics:', error);
      // Optionally show an error notification to the user
    } finally {
      // setIsLoading(false);
    }
  }
  
  setCurrentPoints([]);
  setDrawingMode(false);
};

  // Handle map click to add point to current drawing
  const handleMapClick = (event: any): void => {
    if (!drawingMode) return;
    
    // Add clicked point to current points
    if (event.coordinate) {
      setCurrentPoints([...currentPoints, [event.coordinate[0], event.coordinate[1]]]);
    }
  };

  // Get the deck.gl layers for drawing
  const getDrawingLayers = (): Layer[] => {
    const layers: Layer[] = [];
    
    // Layer for displaying the points being drawn
    if (currentPoints.length > 0 && drawingMode) {
      layers.push(
        new ScatterplotLayer({
          id: 'drawing-points',
          data: currentPoints,
          getPosition: (d: Point) => d,
          getFillColor: [255, 0, 0],
          getRadius: 5,
          pickable: true
        })
      );
    }
    
    // Layer for the current polygon being drawn
    if (currentPoints.length >= 2 && drawingMode) {
      layers.push(
        new PolygonLayer({
          id: 'current-polygon',
          data: [{ polygon: currentPoints }],
          getPolygon: (d: { polygon: Point[] }) => d.polygon,
          getFillColor: [255, 0, 0, 100],
          getLineColor: [255, 0, 0],
          lineWidthMinPixels: 2,
          pickable: true,
          stroked: true,
          filled: true
        })
      );
    }
    
    // Layer for displaying saved polygons
    if (finishedPolygons.length > 0) {
      layers.push(
        new PolygonLayer({
          id: 'saved-polygons',
          data: finishedPolygons.map(points => ({ polygon: points })),
          getPolygon: (d: { polygon: Point[] }) => d.polygon,
          getFillColor: [0, 200, 0, 100],
          getLineColor: [0, 200, 0],
          lineWidthMinPixels: 2,
          pickable: true,
          stroked: true,
          filled: true
        })
      );
    }
    
    return layers;
  };
  
  // Get the most recently drawn area
  const getDrawnArea = (): Polygon | null => {
    return finishedPolygons.length > 0 ? finishedPolygons[finishedPolygons.length - 1] : null;
  };
  
  // Calculate area in square meters
  const calculateArea = (polygon: Polygon | null): number => {
    if (!polygon || polygon.length < 3) {
      return 0;
    }
    
    // Simple shoelace formula for approximation
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      console.log('Polygon:', polygon[j], polygon[i]);
      area += polygon[i][0] * polygon[j][1];
      area -= polygon[j][0] * polygon[i][1];
    }
    
    // Convert to square meters (rough approximation - depends on location)
    // This should be replaced with a proper geospatial calculation in production
    return Math.abs(area) / 2 * 111319.9 * 111319.9;
  };
  
  // Calculate carbon metrics based on area
  const calculateCarbonMetrics = async (polygon: Polygon): Promise<CarbonMetricsData> => {
  try {
    // Fetch the GeoJSON data
    const response = await fetch('/15_carbon_lulc_joined.geojson');
    if (!response.ok) {
      console.error('Failed to load GeoJSON data');
      throw new Error('Failed to load GeoJSON data');
    }
    
    const geojsonData = await response.json();
    
    // Create a point-in-polygon test function
    const containsPoint = (point: [number, number], poly: Polygon): boolean => {
      // Ray-casting algorithm for point-in-polygon detection
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        
        const intersect = ((yi > point[1]) !== (yj > point[1])) &&
          (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
          
        if (intersect) inside = !inside;
      }
      return inside;
    };
    
    // Filter features that intersect with the drawn polygon
    let totalCarbon2017 = 0;
    let totalCarbon2024 = 0;
    let includedFeatures = 0;
    let totalArea = 0;
    
    // Calculate centroid of each feature and test if it's in the polygon
    for (const feature of geojsonData.features) {
      if (!feature.geometry || 
          !feature.geometry.coordinates || 
          !Array.isArray(feature.geometry.coordinates[0]) || 
          !Array.isArray(feature.geometry.coordinates[0][0])) {
        continue; // Skip invalid geometries
      }
      
      // Get the coordinates from the first polygon in the MultiPolygon
      const coordinates = feature.geometry.coordinates[0][0];
      
      // Calculate the centroid
      let sumX = 0, sumY = 0;
      for (const coord of coordinates) {
        sumX += coord[0];
        sumY += coord[1];
      }
      const centroid: [number, number] = [sumX / coordinates.length, sumY / coordinates.length];
      
      // Check if the centroid is in the drawn polygon
      if (containsPoint(centroid, polygon)) {
        if (feature.properties && 
            typeof feature.properties.total_carbon_2017_sum === 'number' && 
            typeof feature.properties.total_carbon_2024_sum === 'number') {
          totalCarbon2017 += feature.properties.total_carbon_2017_sum;
          totalCarbon2024 += feature.properties.total_carbon_2024_sum;
          
          // If feature has area info, add it to the total
          if (feature.properties.area && typeof feature.properties.area === 'number') {
            totalArea += feature.properties.area;
          }
          
          includedFeatures++;
        }
      }
    }
    
    if (includedFeatures === 0) {
      console.warn('No GeoJSON features found in the drawn area');
      // Fallback to using the drawn polygon area
      totalArea = calculateAreaFromPolygon(polygon);
    }
    
    // Calculate the metrics based on the formula provided
    const forestGrowth = (totalCarbon2024 - totalCarbon2017)/7;
    const leakage = forestGrowth * 0.1; // 10% of forest growth
    const netSequestration = forestGrowth - leakage; // 5% of forest growth
    const marketableCredits = netSequestration > 0 ? netSequestration * 96000 : 0;
    
    // Return the metrics
    return {
      area: Math.round(totalArea),
      carbonStocks: Math.round(totalCarbon2017),
      forestGrowth: Math.round(forestGrowth),
      leakage: Math.round(leakage),
      netSequestration: Math.round(netSequestration),
      marketableCredits: Math.round(marketableCredits),
    };
  } catch (error) {
    console.error('Error calculating carbon metrics:', error);
    // If there's an error, calculate area from the polygon and return null metrics
    const area = calculateAreaFromPolygon(polygon);
    throw error; // Rethrow the error to be handled by the caller
  }
};

const calculateAreaFromPolygon = (polygon: Polygon): number => {
  if (!polygon || polygon.length < 3) {
    return 0;
  }
  
  // Simple shoelace formula for approximation
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i][0] * polygon[j][1];
    area -= polygon[j][0] * polygon[i][1];
  }
  
  // Convert to square meters (approximation based on the location)
  return Math.abs(area) / 2 * 111319.9 * 111319.9;
};

const fallbackCarbonMetrics = (polygon: Polygon): CarbonMetricsData => {
  const area = calculateArea(polygon);
  const carbonStocks = Math.round(area * 0.075);
  const forestGrowth = Math.round(area * 0.15);
  const leakage = Math.round(area * 0.1);
  const netSequestration = forestGrowth - leakage;
  const marketableCredits = Math.round(netSequestration * 96000);
  
  return {
    area: Math.round(area),
    carbonStocks,
    forestGrowth,
    leakage,
    netSequestration,
    marketableCredits,

  };
}
  // Clear all drawings
  const clearDrawings = (): void => {
    setCurrentPoints([]);
    setFinishedPolygons([]);
    setCarbonMetrics(null);
  };
  
  // Context value
  const value: DrawingContextType = {
    drawingMode,
    startDrawingMode,
    endDrawingMode,
    handleMapClick,
    getDrawingLayers,
    getDrawnArea,
    calculateArea,
    clearDrawings,
    carbonMetrics,
    metricLayers,
    toggleMetricLayer,
    setAllMetricLayers
  };
  
  return (
    <DrawingContext.Provider value={value}>
      {children}
    </DrawingContext.Provider>
  );
};

/**
 * Custom hook to access the drawing context
 * @returns DrawingContextType
 */
export const useDrawing = () => {
  const context = useContext(DrawingContext);
  
  if (context === null) {
    // Return a default implementation instead of throwing an error
    return {
      drawingMode: false,
      startDrawingMode: () => {},
      endDrawingMode: () => {},
      handleMapClick: () => {},
      getDrawingLayers: () => [],
      getDrawnArea: () => null,
      calculateArea: () => 0,
      clearDrawings: () => {},
      carbonMetrics: null,
      metricLayers: [],
      toggleMetricLayer: () => {},
      setAllMetricLayers: () => {}
    };
  }
  
  return context;
};