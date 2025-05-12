import { MetricLayerType } from "@/components/ui/drawing-context";
import { CompositeLayer } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";

// Type for a polygon (array of points)
type Point = [number, number];
type Polygon = Point[];

interface CarbonMetricsData {
  area: number;
  carbonStocks: number;
  forestGrowth: number;
  leakage: number;
  netSequestration: number;
  marketableCredits: number;
}

interface LayerVisibility {
  id: MetricLayerType;
  visible: boolean;
}

// Helper function to calculate metrics based on GeoJSON features inside the drawn area
const calculateMetricsFromGeoJSON = async (polygon: Polygon): Promise<CarbonMetricsData | null> => {
  try {
    // Fetch the GeoJSON data
    const response = await fetch('/15_carbon_lulc_joined.geojson');
    if (!response.ok) {
      console.error('Failed to load GeoJSON data');
      return null;
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
          includedFeatures++;
        }
      }
    }
    
    if (includedFeatures === 0) {
      console.warn('No GeoJSON features found in the drawn area');
      return null;
    }
    
    // Calculate the metrics based on the formula provided
    const forestGrowth = (totalCarbon2024 - totalCarbon2017)/7;
    const leakage = forestGrowth * 0.1; // 10% of forest growth
    const netSequestration = forestGrowth - leakage; // 5% of forest growth
    const marketableCredits = netSequestration > 0 ? netSequestration * 96000:0;
    
    // Return the metrics
    return {
      area: calculateArea(polygon),
      carbonStocks: totalCarbon2017,
      forestGrowth,
      leakage,
      netSequestration,
      marketableCredits
    };
  } catch (error) {
    console.error('Error calculating metrics from GeoJSON:', error);
    return null;
  }
};

// Helper function to generate GeoJSON for a specific metric
const generateMetricGeoJSON = (
  polygon: Polygon, 
  metricId: MetricLayerType, 
  metricName: string,
  value: string | number, 
  color: number[], 
  order: number
) => {
  // Ensure polygon is closed (first and last points are the same)
  const closedPolygon = [...polygon];
  if (closedPolygon.length > 0 && (
      closedPolygon[0][0] !== closedPolygon[closedPolygon.length - 1][0] || 
      closedPolygon[0][1] !== closedPolygon[closedPolygon.length - 1][1])) {
    closedPolygon.push([...closedPolygon[0]]);
  }
  
  // Create single GeoJSON feature
  return {
    type: "Feature",
    properties: {
      id: metricId,
      metric: metricName,
      value: value.toString(),
      color,
      order
    },
    geometry: {
      type: "Polygon",
      coordinates: [closedPolygon]
    }
  };
};

// Area calculation using the shoelace formula
const calculateArea = (polygon: Polygon): number => {
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

// Create a custom CompositeLayer
class CarbonMetricsLayers extends CompositeLayer {
  initializeState(context: any) {
    super.initializeState(context);
    
    // Initialize with null metrics, to be updated when drawnArea changes
    this.setState({
      metricsData: null
    });
    
    // Calculate metrics from GeoJSON
    this.updateMetricsFromGeoJSON();
  }
  
  updateState({ props, oldProps, changeFlags, context }: any) {
    super.updateState({ props, oldProps, changeFlags, context });
    
    // If drawn area changed, recalculate metrics from GeoJSON
    if (props.data?.drawnArea !== oldProps.data?.drawnArea) {
      this.updateMetricsFromGeoJSON();
    }
  }
  
  updateMetricsFromGeoJSON() {
    const props = this.props as any;
    const drawnArea = props.data?.drawnArea;
    
    if (!drawnArea || drawnArea.length < 3) return;
    
    // Calculate metrics based on GeoJSON data
    calculateMetricsFromGeoJSON(drawnArea).then(metrics => {
      if (metrics) {
        this.setState({ metricsData: metrics });
        
        // Update parent component's metrics if callback is provided
        if (props.data && typeof props.onMetricsCalculated === 'function') {
          props.onMetricsCalculated(metrics);
        }
      }
    });
  }

  renderLayers() {
    // Extract props safely with type assertions
    const props = this.props as any;
    const { id, data } = props;
    
    // Get area, metrics, and layer visibility
    const drawnArea = data?.drawnArea;
    
    // Use metrics from state if available, otherwise use provided metrics
    const metricsData = this.state.metricsData || data?.metrics;
    const visibleLayers = data?.visibleLayers || [];
    
    // If no polygon or no metrics data, return empty array
    if (!drawnArea || !metricsData || drawnArea.length < 3) {
      return [];
    }

    // Create all the potential metric features
    const metricFeatures = [
      {
        id: "areaCoverage" as MetricLayerType,
        name: "Area Coverage",
        value: `${metricsData.area.toLocaleString()}m²`,
        color: [0, 128, 255, 150],
        order: 1
      },
      {
        id: "carbonStock" as MetricLayerType,
        name: "Carbon Stock Baseline",
        value: `${metricsData.carbonStocks.toLocaleString()} tCO₂e`,
        color: [0, 200, 0, 130],
        order: 2
      },
      {
        id: "forestGrowth" as MetricLayerType,
        name: "Project Forest Growth",
        value: `${metricsData.forestGrowth.toLocaleString()} tCO₂e`,
        color: [0, 255, 0, 110],
        order: 3
      },
      {
        id: "leakage" as MetricLayerType,
        name: "Leakage Risk",
        value: `${metricsData.leakage.toLocaleString()} tCO₂e`,
        color: [255, 100, 0, 110],
        order: 4
      },
      {
        id: "netSequestration" as MetricLayerType,
        name: "Net Sequestration",
        value: `${metricsData.netSequestration.toLocaleString()} tCO₂e`,
        color: [50, 200, 150, 120],
        order: 5
      },
      {
        id: "marketableCredits" as MetricLayerType,
        name: "Marketable Credits",
        value: `Rp. ${metricsData.marketableCredits.toLocaleString()}`,
        color: [120, 80, 200, 140],
        order: 6
      }
    ];
    
    // Filter to only include the visible layers and convert to GeoJSON features
    const visibleFeatures = metricFeatures
      .filter(feature => {
        // Find if this layer is visible
        const layerInfo = visibleLayers.find((l: any) => l.id === feature.id);
        return layerInfo && layerInfo.visible;
      })
      .map(feature => 
        generateMetricGeoJSON(
          drawnArea, 
          feature.id, 
          feature.name, 
          feature.value, 
          feature.color, 
          feature.order
        )
      );
    
    // Create individual layers for each visible metric
    return visibleFeatures.map((feature, index) => {
      return new GeoJsonLayer({
        id: `${id}-metric-${feature.properties.id}`,
        data: feature as any, // Pass as array with single feature
        opacity: 0.7,
        stroked: true,
        filled: true,
        lineWidthMinPixels: 2,
        // Use the fixed color from the feature directly
        getFillColor: () => feature.properties.color as [number, number, number],
        getLineColor: [255, 255, 255],
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        getElevation: 10 + (feature.properties.order * 10), // Stack them with increasing elevation
        parameters: {
          // This helps with z-fighting when layers overlap
          depthTest: true
        }
      });
    });
  }
}

// Set the layer name
CarbonMetricsLayers.layerName = 'CarbonMetricsLayers';

export default CarbonMetricsLayers;