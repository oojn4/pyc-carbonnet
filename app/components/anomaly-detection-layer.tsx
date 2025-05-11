import { CompositeLayer } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";

// Interface for anomaly data point
interface AnomalyPoint {
  id: number;
  position: [number, number];  // [longitude, latitude]
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  radius?: number;
}

// Function to generate dummy anomaly points around a specific area
export const generateDummyAnomalies = (
  centerPolygon: [number, number][] | null,
  count: number = 5
): AnomalyPoint[] => {
  if (!centerPolygon || centerPolygon.length < 3) {
    // Default center if no polygon available
    const defaultCenter: [number, number] = [101.4383, 0.5104];
    return generateAnomaliesAroundPoint(defaultCenter, count);
  }

  // Calculate polygon center
  const centerLng = centerPolygon.reduce((sum, point) => sum + point[0], 0) / centerPolygon.length;
  const centerLat = centerPolygon.reduce((sum, point) => sum + point[1], 0) / centerPolygon.length;
  
  return generateAnomaliesAroundPoint([centerLng, centerLat], count);
};

// Helper to generate anomalies around a specific point
const generateAnomaliesAroundPoint = (
  center: [number, number],
  count: number
): AnomalyPoint[] => {
  const [centerLng, centerLat] = center;
  const anomalies: AnomalyPoint[] = [];
  
  // Types of anomalies to randomly select from
  const anomalyTypes = [
    { type: 'Deforestation', description: 'Potential unauthorized clearing detected' },
    { type: 'Carbon Stock Inconsistency', description: 'Reported vs measured stock discrepancy' },
    { type: 'Boundary Violation', description: 'Project boundary overlap with restricted area' },
    { type: 'Degradation', description: 'Forest degradation above expected threshold' },
    { type: 'Reporting Error', description: 'Measurement data inconsistent with satellite imagery' },
    { type: 'Conversion Risk', description: 'High risk of land-use conversion detected' },
    { type: 'Illegal Activity', description: 'Signs of unauthorized activity detected' }
  ];
  
  // Severity levels with probabilities (high: 20%, medium: 50%, low: 30%)
  const severityLevels: Array<'high' | 'medium' | 'low'> = [
    'high', 'high',  // 20% chance
    'medium', 'medium', 'medium', 'medium', 'medium',  // 50% chance
    'low', 'low', 'low'  // 30% chance
  ];
  
  // Scale factor to determine spread of points around center
  const scale = 0.02;
  
  for (let i = 0; i < count; i++) {
    // Generate random offset from center
    const lngOffset = (Math.random() - 0.5) * scale * 2;
    const latOffset = (Math.random() - 0.5) * scale * 2;
    
    // Select random anomaly type and severity
    const typeIndex = Math.floor(Math.random() * anomalyTypes.length);
    const severityIndex = Math.floor(Math.random() * severityLevels.length);
    
    // Random radius based on severity (higher severity = larger radius)
    const radiusMap = { high: 300, medium: 200, low: 150 };
    const severity = severityLevels[severityIndex];
    
    anomalies.push({
      id: i + 1,
      position: [centerLng + lngOffset, centerLat + latOffset],
      severity: severity,
      type: anomalyTypes[typeIndex].type,
      description: anomalyTypes[typeIndex].description,
      radius: radiusMap[severity]
    });
  }
  
  return anomalies;
};

// Custom composite layer for anomaly detection visualization
class AnomalyDetectionLayer extends CompositeLayer {
  initializeState(context: any) {
    super.initializeState(context);
  }

  renderLayers() {
    const props = this.props as any;
    const { id, data, onClick } = props;
    
    // If no anomaly data, return empty array
    if (!data || !data.anomalies || data.anomalies.length === 0) {
      return [];
    }
    
    const anomalies = data.anomalies;
    const selectedId = data.selectedId || null;
    
    // Define colors for different severity levels
    const severityColors = {
      high: [255, 59, 48, 200],    // Red
      medium: [255, 149, 0, 200],  // Orange
      low: [255, 204, 0, 200]      // Yellow
    };
    
    // Create scatterplot layer for anomaly points
    const pointsLayer = new ScatterplotLayer({
      id: `${id}-points`,
      data: anomalies,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 6,
      radiusMaxPixels: 20,
      lineWidthMinPixels: 1,
      getPosition: (d: AnomalyPoint) => d.position,
      getRadius: (d: AnomalyPoint) => d.radius || 200,
      getFillColor: (d: AnomalyPoint) => {
        // Highlight the selected anomaly
        if (selectedId === d.id) {
          return [255, 255, 255, 220]; // White highlight for selected
        }
        return severityColors[d.severity] as [number,number,number];
      },
      getLineColor: (d: AnomalyPoint) => {
        // Bold border for selected anomaly
        if (selectedId === d.id) {
          return [0, 0, 0, 255]; // Black border for selected
        }
        return [255, 255, 255];
      },
      getLineWidth: (d: AnomalyPoint) => (selectedId === d.id ? 2 : 1),
      onHover: props.onHover,
      onClick,
      autoHighlight: true,
      updateTriggers: {
        getFillColor: [selectedId],
        getLineColor: [selectedId],
        getLineWidth: [selectedId]
      }
    });
    
    // Create text layer for anomaly IDs
    const textLayer = new TextLayer({
      id: `${id}-labels`,
      data: anomalies,
      pickable: true,
      getPosition: (d: AnomalyPoint) => d.position,
      getText: (d: AnomalyPoint) => `${d.id}`,
      getColor: (d: AnomalyPoint) => selectedId === d.id ? [0, 0, 0, 255] : [255, 255, 255],
      getSize: (d: AnomalyPoint) => selectedId === d.id ? 16 : 14,
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      updateTriggers: {
        getColor: [selectedId],
        getSize: [selectedId]
      }
    });
    
    return [pointsLayer, textLayer];
  }
}

// Set layer name
AnomalyDetectionLayer.layerName = 'AnomalyDetectionLayer';

export default AnomalyDetectionLayer;