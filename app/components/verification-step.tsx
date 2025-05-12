import { Button } from "@/components/ui/button";
import { useDrawing } from "@/components/ui/drawing-context";
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineLine
} from "@/components/ui/timeline";
import { Layer } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { AlertCircle, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// Utility to add anomaly layer to global layer control
// This assumes you're using the DirectLayerControl approach
declare global {
  interface Window {
    addAnomalyLayer?: (id: string, name: string, color: number[], visible: boolean) => void;
  }
}

// Interface for anomaly data
interface AnomalyInfo {
  id: number;
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  location: [number, number]; // Lon, Lat coordinates
}

interface VerificationStepProps {
  // You can add props if needed
}

const VerificationStep: React.FC<VerificationStepProps> = () => {
  const { carbonMetrics, getDrawnArea } = useDrawing();
  const [verificationInProgress, setVerificationInProgress] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyInfo | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyInfo[]>([]);
  const [showAnomalyDetails, setShowAnomalyDetails] = useState(false);
  
  // Reference to store anomaly layers
  const anomalyLayersRef = useRef<Layer[]>([]);
  
  // Helper function to generate forest growth percentage
  const calculateForestGrowthPercentage = (): number => {
    if (!carbonMetrics) return 0;
    
    const baseline2017 = carbonMetrics.carbonStocks - carbonMetrics.forestGrowth;
    
    // Avoid division by zero
    if (baseline2017 === 0) return 0;
    
    return (carbonMetrics.forestGrowth / baseline2017) * 100;
  };
  
  // Helper function to get bounding box from polygon
  const getBoundingBox = (polygon: [number, number][]) => {
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    polygon.forEach(point => {
      const [lon, lat] = point;
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
    
    return { minLon, maxLon, minLat, maxLat };
  };
  
  // Function to detect anomalies based on forest growth percentage
  const detectAnomalies = () => {
    const drawnArea = getDrawnArea ? getDrawnArea() : null;
    if (!drawnArea || !carbonMetrics) return;
    
    const forestGrowthPercentage = calculateForestGrowthPercentage();
    const hasHighGrowthAnomaly = forestGrowthPercentage > 20;
    
    // Generate anomalies based on growth percentage
    const detectedAnomalies: AnomalyInfo[] = [];
    
    // Get center of drawn area
    const centerLon = drawnArea.reduce((sum, point) => sum + point[0], 0) / drawnArea.length;
    const centerLat = drawnArea.reduce((sum, point) => sum + point[1], 0) / drawnArea.length;
    
    // Add high growth anomaly if detected
    if (hasHighGrowthAnomaly) {
      detectedAnomalies.push({
        id: 1,
        severity: 'high',
        type: 'Unusual Carbon Growth',
        description: `Detected ${forestGrowthPercentage.toFixed(1)}% growth in carbon stocks between 2015-2020, which exceeds expected natural sequestration rates. This may indicate measurement error or unreported activities.`,
        location: [centerLon, centerLat]
      });
    }
    
    // Generate points within the polygon
    const getRandomPointInPolygon = () => {
      // Simple way to generate a point that's likely within the polygon
      const bbox = getBoundingBox(drawnArea);
      const randomLon = bbox.minLon + Math.random() * (bbox.maxLon - bbox.minLon);
      const randomLat = bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat);
      return [randomLon, randomLat] as [number, number];
    };
    
    // Always add a few anomalies for demonstration
    if (carbonMetrics.area) {
      // Add boundary issue anomaly
      const boundaryPoint = getRandomPointInPolygon();
      detectedAnomalies.push({
        id: 2,
        severity: 'medium',
        type: 'Boundary Inconsistency',
        description: 'Project boundary overlaps with a protected area. Verify boundary coordinates and adjust if necessary.',
        location: boundaryPoint
      });
      
      // Add LULC classification anomaly
      const lulcPoint = getRandomPointInPolygon();
      detectedAnomalies.push({
        id: 3,
        severity: 'medium',
        type: 'LULC Classification Error',
        description: 'Land use classification appears inconsistent with satellite imagery. Area classified as forest in 2020 appears as non-forest in high-resolution imagery.',
        location: lulcPoint
      });
      
      // Add small deforestation area anomaly
      const deforestationPoint = getRandomPointInPolygon();
      detectedAnomalies.push({
        id: 4,
        severity: 'high',
        type: 'Potential Deforestation',
        description: 'Small area of forest loss detected in the northern section of the project area. Approximately 0.5 hectares affected.',
        location: deforestationPoint
      });
    }
    
    setAnomalies(detectedAnomalies);
    
    // Create GeoJSON layers for anomalies
    if (detectedAnomalies.length > 0) {
      // Create anomaly points layer
      const anomalyPointsLayer = new GeoJsonLayer({
        id: 'anomaly-points',
        data: {
          type: 'FeatureCollection',
          features: detectedAnomalies.map(anomaly => ({
            type: 'Feature',
            properties: {
              id: anomaly.id,
              severity: anomaly.severity,
              type: anomaly.type,
              description: anomaly.description
            },
            geometry: {
              type: 'Point',
              coordinates: anomaly.location
            }
          }))
        },
        pointRadiusMinPixels: 8,
        pointRadiusMaxPixels: 20,
        getPointRadius: 15,
        getFillColor: (d: any) => {
          const severity = d.properties.severity;
          if (severity === 'high') return [255, 0, 0, 200]; // Red
          if (severity === 'medium') return [255, 165, 0, 200]; // Orange
          return [255, 255, 0, 200]; // Yellow for low
        },
        getLineColor: [0, 0, 0, 200],
        lineWidthMinPixels: 2,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 200],
        onHover: (info: any) => {
          if (info.object) {
            const { id, severity, type, description } = info.object.properties;
            const location = info.object.geometry.coordinates;
            setSelectedAnomaly({
              id,
              severity,
              type,
              description,
              location
            });
          } else {
            setSelectedAnomaly(null);
          }
        },
        onClick: () => {
          setShowAnomalyDetails(true);
        }
      });
      
      // Create anomaly areas layer
      const anomalyAreasLayer = new GeoJsonLayer({
        id: 'anomaly-areas',
        data: {
          type: 'FeatureCollection',
          features: detectedAnomalies.map(anomaly => {
            const [lon, lat] = anomaly.location;
            // Create a small polygon around the point (0.005 degrees ~ 500m)
            const offset = 0.005;
            return {
              type: 'Feature',
              properties: {
                id: anomaly.id,
                severity: anomaly.severity
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [lon - offset, lat - offset],
                  [lon + offset, lat - offset],
                  [lon + offset, lat + offset],
                  [lon - offset, lat + offset],
                  [lon - offset, lat - offset]
                ]]
              }
            };
          })
        },
        filled: true,
        stroked: true,
        getFillColor: (d: any) => {
          const severity = d.properties.severity;
          if (severity === 'high') return [255, 0, 0, 50]; // Red
          if (severity === 'medium') return [255, 165, 0, 50]; // Orange
          return [255, 255, 0, 50]; // Yellow for low
        },
        getLineColor: (d: any) => {
          const severity = d.properties.severity;
          if (severity === 'high') return [255, 0, 0, 200]; // Red
          if (severity === 'medium') return [255, 165, 0, 200]; // Orange
          return [255, 255, 0, 200]; // Yellow for low
        },
        lineWidthMinPixels: 1,
        pickable: false
      });
      
      // Store layers for later use
      anomalyLayersRef.current = [anomalyAreasLayer, anomalyPointsLayer];
      
      // Add to global layer control if available
      if (window.addAnomalyLayer) {
        window.addAnomalyLayer('anomaly-areas', 'Anomaly Areas', [255, 0, 0], true);
        window.addAnomalyLayer('anomaly-points', 'Anomaly Points', [255, 0, 0], true);
      }
    }
  };
  
  // Run anomaly detection on component mount
  useEffect(() => {
    detectAnomalies();
    
    // Simulate verification process completing after 8 seconds
    const timer = setTimeout(() => {
      setVerificationInProgress(false);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [carbonMetrics, getDrawnArea]);
  
  const severityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-yellow-500',
  };
  
  // Modal for detailed anomaly information
  const AnomalyDetailsModal = () => {
    if (!selectedAnomaly || !showAnomalyDetails) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-md shadow-lg w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold">Anomaly Details</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAnomalyDetails(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className={`size-4 ${severityColors[selectedAnomaly.severity]} rounded-full`}></div>
              <h4 className="font-medium text-lg">{selectedAnomaly.type}</h4>
            </div>
            
            <div>
              <p className="text-sm text-gray-700">{selectedAnomaly.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
              <div>
                <div className="text-xs text-gray-500">ID</div>
                <div className="font-medium">#{selectedAnomaly.id}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Severity</div>
                <div className="font-medium capitalize">{selectedAnomaly.severity}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500">Location</div>
                <div className="font-medium">
                  {selectedAnomaly.location[1].toFixed(5)}, {selectedAnomaly.location[0].toFixed(5)}
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-md border border-orange-100">
              <h5 className="font-medium text-orange-800 mb-1">Recommended Action</h5>
              <p className="text-sm text-orange-700">
                {selectedAnomaly.severity === 'high' 
                  ? 'Immediate field verification required. This anomaly must be addressed before proceeding to certification.'
                  : selectedAnomaly.severity === 'medium'
                    ? 'Field verification recommended. Document and explain this anomaly in your final report.'
                    : 'Monitor this area in future assessments. No immediate action required.'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={() => setShowAnomalyDetails(false)}>
              Close
            </Button>
            <Button>
              Mark as Addressed
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      {/* Anomaly details modal */}
      <AnomalyDetailsModal />
      
      <Timeline positions="left" className="space-y-4">
        <TimelineItem status="done">
          {/* <TimelineHeading className="line-clamp-1 flex w-full flex-row items-center justify-between text-ellipsis font-semibold text-sm">
            Measurement
          </TimelineHeading> */}
          <TimelineDot status="done" />
          <TimelineLine done className="min-h-4" />
          <TimelineContent side="right" className="w-full py-2">
            <div className="text-sm text-gray-500">Measurement completed</div>
          </TimelineContent>
        </TimelineItem>
        
        <TimelineItem status="done">
          {/* <TimelineHeading className="line-clamp-1 flex w-full flex-row items-center justify-between text-ellipsis font-semibold text-sm">
            Reporting
          </TimelineHeading> */}
          <TimelineDot status="done" />
          <TimelineLine done className="min-h-4" />
          <TimelineContent side="right" className="w-full py-2">
            <div className="text-sm text-gray-500">Reports generated</div>
          </TimelineContent>
        </TimelineItem>
        
        <TimelineItem status={"default"}>
          {/* <TimelineHeading className="line-clamp-1 flex w-full flex-row items-center justify-between text-ellipsis font-semibold text-sm">
            Verification
          </TimelineHeading> */}
          <TimelineDot status="current" />
          <TimelineLine done className="min-h-4" />
          <TimelineContent side="right" className="w-full space-y-4 py-2">
            <div className="prose space-y-2 text-sm">
              <p>
                Your carbon measurement data and reports are now being verified. Our system conducts both anomaly detection and ground-truth checking.
              </p>
            </div>
            
            <div className="rounded-md border bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-500 rounded-full p-2">
                  <AlertCircle className="size-4 text-white" />
                </div>
                <span className="font-medium">Anomaly Detection</span>
              </div>
              <p className="text-sm">
                Our AI analyzes your project data for inconsistencies and potential errors.
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-blue-100">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: verificationInProgress ? '75%' : '100%' }}></div>
              </div>
            </div>
            
            {/* Anomaly information panel */}
            <div className="rounded-md border p-2 space-y-2">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                <div className="flex items-center gap-2 font-medium text-amber-800 mb-2">
                  <AlertCircle className="size-4 text-amber-500" />
                  <span>Anomalies Detected</span>
                </div>
                <p className="text-sm text-amber-700">
                  {anomalies.length} anomalies have been detected in your carbon project area. 
                  {anomalies.filter(a => a.severity === 'high').length > 0 && 
                    ` Including ${anomalies.filter(a => a.severity === 'high').length} high-severity issues that require immediate attention.`}
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  Use the map to identify and inspect each anomaly. Click on the anomaly markers for detailed information.
                </p>
              </div>
              
              {/* List of detected anomalies */}
              <div className="space-y-1 mt-2">
                <div className="font-medium text-sm">Detected Anomalies:</div>
                {anomalies.map(anomaly => (
                  <div key={anomaly.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`size-3 ${severityColors[anomaly.severity]} rounded-full`}></div>
                      <span>#{anomaly.id}: {anomaly.type}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedAnomaly(anomaly);
                        setShowAnomalyDetails(true);
                      }}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <span>🔍 Anomalies are now visible on the main map. Toggle them using the layer controls.</span>
              </div>
            </div>
            
            {/* <div className="rounded-md border bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-green-500 rounded-full p-2">
                  <CheckCircle className="size-4 text-white" />
                </div>
                <span className="font-medium">Ground-Truth Checking</span>
              </div>
              <p className="text-sm">
                Using high-resolution satellite imagery to verify your carbon project.
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-green-100">
                <div className="h-2 rounded-full bg-green-500" style={{ width: verificationInProgress ? '60%' : '100%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2 mt-2">
              <div className="text-sm font-medium">Verification Reports</div>
              
              <div className="space-y-2 rounded-md border p-2 bg-orange-50">
                <div className="font-bold text-sm flex items-center gap-2">
                  <div className="flex items-center justify-center bg-orange-500 text-white rounded-full w-6 h-6 text-xs">4</div>
                  Anomaly Detection Report
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{verificationInProgress ? 'In progress...' : `${anomalies.length} anomalies detected`}</span>
                  <Button variant="outline" size="sm" className="h-8" disabled={verificationInProgress}>
                    <FileCheck className="size-4 mr-1" /> {verificationInProgress ? 'Pending' : 'View'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 rounded-md border p-2 bg-orange-50">
                <div className="font-bold text-sm flex items-center gap-2">
                  <div className="flex items-center justify-center bg-orange-500 text-white rounded-full w-6 h-6 text-xs">5</div>
                  RS-Based Verification Report
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{verificationInProgress ? 'In progress...' : 'Completed'}</span>
                  <Button variant="outline" size="sm" className="h-8" disabled={verificationInProgress}>
                    <FileCheck className="size-4 mr-1" /> {verificationInProgress ? 'Pending' : 'View'}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 flex gap-2">
              <div className="bg-amber-500 rounded-full p-2 h-fit">
                <AlertCircle className="size-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-amber-800">Anti Money Laundering Detection</p>
                <p className="text-sm text-amber-700">
                  Our system is checking for potential money laundering activities related to carbon credits.
                </p>
              </div>
            </div>
            
            <div className="mt-2 p-3 border border-green-200 rounded-md bg-green-50 text-green-800 text-sm">
              <p className="font-medium">Validation {verificationInProgress ? 'in progress' : 'completed'}</p>
              <p className="mt-1">{verificationInProgress ? 'Estimated completion: 2-3 business days' : 'Detected anomalies require resolution before final certification'}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-green-100">
                <div className="h-2 rounded-full bg-green-500 animate-pulse" style={{ width: verificationInProgress ? '30%' : '80%' }}></div>
              </div>
            </div>
            
            {!verificationInProgress && (
              <Button className="w-full">
                Resolve Anomalies & Proceed to Certification
              </Button>
            )} */}
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    </>
  );
};

// Export the anomaly layers so DeckGLLayers can use them
export const getAnomalyLayers = (verificationStepRef?: React.RefObject<any>): Layer[] => {
  if (verificationStepRef?.current?.anomalyLayersRef?.current) {
    return verificationStepRef.current.anomalyLayersRef.current;
  }
  return [];
};

export default VerificationStep;