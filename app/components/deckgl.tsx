import CarbonMetricsLayers from "@/components/carbon-metrics-layers";
import { useDrawing } from "@/components/ui/drawing-context";
import { useGeoJSON } from "@/components/ui/geojson-context";
import { DeckGLOverlay } from "@/components/ui/maps-deckgl";
import { getAnomalyLayers } from "@/components/verification-step";
import { Layer, PickingInfo } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// LULC color mapping
const LULC_COLORS = {
  1: [0, 100, 255], // Water - Blue
  2: [0, 180, 0],   // Trees - Green
  4: [0, 150, 130], // Flooded Vegetation - Teal
  5: [255, 255, 0], // Crops - Yellow
  7: [220, 0, 0],   // Built Area - Red
  8: [170, 170, 170], // Bare Ground - Gray
  9: [255, 255, 255], // Snow/Ice - White
  10: [200, 200, 255], // Clouds - Light Blue
  11: [255, 180, 50], // Rangeland - Orange
};

/**
 * All layers from deck.gl instance including drawing layers and anomaly detection
 */
const DeckGLLayers: React.FC = () => {
  const {
    drawingMode,
    handleMapClick,
    getDrawingLayers,
    getDrawnArea,
    carbonMetrics,
    metricLayers
  } = useDrawing();
  
  const verificationStepRef = useRef<any>(null);
  
  // State to store selected anomaly
  const [selectedAnomaly, setSelectedAnomaly] = useState<number | null>(null);
  
  // State to store the loaded GeoJSON data
  const [geodata, setGeodata] = useState<any>(null);
  
  // State to store anomaly layers
  const [anomalyLayers, setAnomalyLayers] = useState<Layer[]>([]);

  // Helper function to update anomaly layers
  const updateAnomalyLayers = () => {
    // Try to get anomaly layers from verification step
    if (verificationStepRef.current) {
      const layers = getAnomalyLayers(verificationStepRef.current);
      if (layers && layers.length > 0) {
        setAnomalyLayers(layers);
      }
    }
  };
  
  // Load GeoJSON data
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        const response = await fetch('/15_carbon_lulc_joined.geojson');
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON: ${response.status}`);
        }
        const jsonData = await response.json();
        setGeodata(jsonData);
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      }
    };

    loadGeoJSON();
  }, []);
  
  // Update anomaly layers when verification step is mounted
  useEffect(() => {
    // Check every second for anomaly layers
    const interval = setInterval(() => {
      updateAnomalyLayers();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Use GeoJSON context
  const { geojsonLayersVisible, geojsonLayers } = useGeoJSON();
  
  // Create GeoJSON layers
  const createGeoJSONLayers = useMemo(() => {
    if (!geodata || !geojsonLayersVisible) {
      return [];
    }
    
    try {
      // Filter which layers are visible
      const visibleLayers = geojsonLayers.filter(layer => layer.visible);
      
      if (visibleLayers.length === 0) {
        return [];
      }
      
      const layers: Layer[] = [];
      
      // Create layer for LULC 2017
      if (visibleLayers.some(l => l.id === "lulc-2017")) {
        layers.push(
          new GeoJsonLayer({
            id: 'geojson-lulc-2017',
            data: geodata,
            pickable: true,
            stroked: true,
            filled: true,
            getFillColor: (feature) => {
              const lulcValue = (feature.properties?.lulc_2017_majority as keyof typeof LULC_COLORS) || 0;
              const color = LULC_COLORS[lulcValue as keyof typeof LULC_COLORS] || [100, 100, 100];
              return [color[0], color[1], color[2]]; // Ensure tuple with exactly three numbers
            },
            getLineColor: [80, 80, 80, 255],
            lineWidthMinPixels: 1,
            opacity: 0.7
          })
        );
      }
      
      // Create layer for LULC 2024
      if (visibleLayers.some(l => l.id === "lulc-2024")) {
        layers.push(
          new GeoJsonLayer({
            id: 'geojson-lulc-2024',
            data: geodata,
            pickable: true,
            stroked: true,
            filled: true,
            getFillColor: (feature) => {
              const lulcValue = (feature.properties?.lulc_2017_majority as keyof typeof LULC_COLORS) || 0;
              const color = LULC_COLORS[lulcValue as keyof typeof LULC_COLORS] || [100, 100, 100];
              return [color[0], color[1], color[2]]; // Ensure tuple with exactly three numbers
            },
            getLineColor: [80, 80, 80, 255],
            lineWidthMinPixels: 1,
            opacity: 0.7
          })
        );
      }
      
      // Create layer for Carbon Stock 2017
      if (visibleLayers.some(l => l.id === "carbon-2017")) {
        layers.push(
          new GeoJsonLayer({
            id: 'geojson-carbon-2017',
            data: geodata,
            pickable: true,
            stroked: true,
            filled: true,
            getFillColor: (feature) => {
              const value = feature.properties?.total_carbon_2017_sum || 0;
              // Scale from light to dark green based on value
              const maxValue = 2000000; // Adjust based on your data
              const intensity = Math.min(1, value / maxValue);
              return [0, Math.round(100 + intensity * 155), 0, 150];
            },
            getLineColor: [80, 80, 80, 255],
            lineWidthMinPixels: 1,
            opacity: 0.7
          })
        );
      }
      
      // Create layer for Carbon Stock 2024
      if (visibleLayers.some(l => l.id === "carbon-2024")) {
        layers.push(
          new GeoJsonLayer({
            id: 'geojson-carbon-2024',
            data: geodata,
            pickable: true,
            stroked: true,
            filled: true,
            getFillColor: (feature) => {
              const value = feature.properties?.total_carbon_2024_sum || 0;
              // Scale from light to dark green based on value
              const maxValue = 2000000; // Adjust based on your data
              const intensity = Math.min(1, value / maxValue);
              return [0, Math.round(100 + intensity * 155), 0, 150];
            },
            getLineColor: [80, 80, 80, 255],
            lineWidthMinPixels: 1,
            opacity: 0.7
          })
        );
      }
      
      // Create layer for Forest Growth
      if (visibleLayers.some(l => l.id === "growth")) {
        layers.push(
          new GeoJsonLayer({
            id: 'geojson-growth',
            data: geodata,
            pickable: true,
            stroked: true,
            filled: true,
            getFillColor: (feature) => {
              const carbon2017 = feature.properties?.total_carbon_2017_sum || 0;
              const carbon2024 = feature.properties?.total_carbon_2024_sum || 0;
              const growth = (carbon2024 - carbon2017)/7;
              
              // Blue (negative) to Green (positive)
              if (growth > 0) {
                const intensity = Math.min(1, growth / 100000);
                return [0, Math.round(150 + intensity * 105), 0, 150];
              } else {
                const intensity = Math.min(1, Math.abs(growth) / 100000);
                return [0, 0, Math.round(150 + intensity * 105), 150];
              }
            },
            getLineColor: [80, 80, 80, 255],
            lineWidthMinPixels: 1,
            opacity: 0.7
          })
        );
      }
      
      // Create layer for Leakage Risk
      if (visibleLayers.some(l => l.id === "leakage")) {
        layers.push(
          new GeoJsonLayer({
            id: 'geojson-leakage',
            data: geodata,
            pickable: true,
            stroked: true,
            filled: true,
            getFillColor: (feature) => {
              const carbon2017 = feature.properties?.total_carbon_2017_sum || 0;
              const carbon2024 = feature.properties?.total_carbon_2024_sum || 0;
              const growth = (carbon2024 - carbon2017)/7;
              const leakage = growth * 0.1; // 10% of growth
              
              // Red scale based on risk
              const intensity = Math.min(1, Math.abs(leakage) / 10000);
              return [Math.round(150 + intensity * 105), 0, 0, 150];
            },
            getLineColor: [80, 80, 80, 255],
            lineWidthMinPixels: 1,
            opacity: 0.7
          })
        );
      }
      
      // Create layer for Net Sequestration
      if (visibleLayers.some(l => l.id === "net-seq")) {
        layers.push(
          new GeoJsonLayer({
            id: 'geojson-net-seq',
            data: geodata,
            pickable: true,
            stroked: true,
            filled: true,
            getFillColor: (feature) => {
              const carbon2017 = feature.properties?.total_carbon_2017_sum || 0;
              const carbon2024 = feature.properties?.total_carbon_2024_sum || 0;
              const growth = (carbon2024 - carbon2017)/7;
              const leakage = growth * 0.1; // 10% of growth
              const netSeq = growth-leakage; // 5% of growth
              
              // Teal scale
              const intensity = Math.min(1, Math.abs(netSeq) / 5000);
              return [0, Math.round(100 + intensity * 155), Math.round(100 + intensity * 155), 150];
            },
            getLineColor: [80, 80, 80, 255],
            lineWidthMinPixels: 1,
            opacity: 0.7
          })
        );
      }
      
      // Create layer for Marketable Credits
      if (visibleLayers.some(l => l.id === "marketable")) {
        layers.push(
          new GeoJsonLayer({
            id: 'geojson-marketable',
            data: geodata,
            pickable: true,
            stroked: true,
            filled: true,
            getFillColor: (feature) => {
              const carbon2017 = feature.properties?.total_carbon_2017_sum || 0;
              const carbon2024 = feature.properties?.total_carbon_2024_sum || 0;
              const growth = (carbon2024 - carbon2017)/7;
              const leakage = growth * 0.1; // 10% of growth
              const netSeq = growth-leakage; // 5% of growth
              const marketable = netSeq>0 ? netSeq*9600:0;
              
              // Purple scale
              const intensity = Math.min(1, Math.abs(marketable) / 100000);
              return [Math.round(100 + intensity * 155), 0, Math.round(150 + intensity * 105), 150];
            },
            getLineColor: [80, 80, 80, 255],
            lineWidthMinPixels: 1,
            opacity: 0.7
          })
        );
      }
      
      // // Add Carbon Pricing layer
      // if (visibleLayers.some(l => l.id === "carbon-pricing")) {
      //   layers.push(
      //     new GeoJsonLayer({
      //       id: 'geojson-carbon-pricing',
      //       data: geodata,
      //       pickable: true,
      //       stroked: true,
      //       filled: true,
      //       getFillColor: (feature) => {
      //         const carbon2017 = feature.properties?.total_carbon_2017_sum || 0;
      //         const carbon2024 = feature.properties?.total_carbon_2024_sum || 0;
      //         const growth = (carbon2024 - carbon2017)/7;
      //         const leakage = growth * 0.1; // 10% of growth
      //         const netSeq = growth-leakage; // 5% of growth
      //         const marketable = netSeq>0 ? netSeq*9600:0;
              
      //         // Blue scale
      //         const maxPrice = 100000000; // 100 million
      //         const intensity = Math.min(1, marketable / maxPrice);
      //         return [50, 150, Math.round(200 + intensity * 55), 150]; // Blue color gradient
      //       },
      //       getLineColor: [80, 80, 80, 255],
      //       lineWidthMinPixels: 1,
      //       opacity: 0.7
      //     })
      //   );
      // }
      
      return layers;
    } catch (error) {
      console.error("Error creating GeoJSON layers:", error);
      return [];
    }
  }, [geodata, geojsonLayersVisible, geojsonLayers]);
  
  // Create layers array with useMemo to prevent unnecessary rerenders
  const layers = useMemo(() => {
    // Get the drawing layers first
    const drawingLayers = getDrawingLayers ? getDrawingLayers() : [];
    
    // Get the drawn area
    const drawnArea = getDrawnArea ? getDrawnArea() : null;
    
    // Check if any metric layers are visible
    const hasVisibleMetricLayers = Array.isArray(metricLayers) && metricLayers.some(layer => layer.visible);
    
    // Only add metrics layers if there's a drawn area, we're not in drawing mode, 
    // and at least one layer is visible
    const carbonMetricsLayers = !drawingMode && drawnArea && hasVisibleMetricLayers ? 
      [new CarbonMetricsLayers({
        id: 'carbon-metrics',
        // Pass the data including visibility settings
        data: {
          drawnArea: drawnArea,
          metrics: carbonMetrics,
          visibleLayers: metricLayers
        }
      }) as unknown as Layer] : [];
    
    // Combine all layers
    // Order: GeoJSON layers (bottom) -> Carbon metrics -> Anomaly layers -> Drawing layers (top)
    return [
      ...createGeoJSONLayers,       // Base GeoJSON data (bottom layer)
      ...carbonMetricsLayers,       // Carbon metrics visualization
      ...anomalyLayers,             // Anomaly detection visualization
      ...drawingLayers              // Drawing tools (top layer)
    ];
  }, [
    getDrawingLayers, 
    drawingMode, 
    getDrawnArea, 
    carbonMetrics, 
    metricLayers,
    createGeoJSONLayers,
    anomalyLayers
  ]);
  
  // Handle click events for drawing and deselection
  const handleClick = useCallback((info: PickingInfo<any>, event: any) => {
    if (drawingMode) {
      handleMapClick(info);
      return true; // Prevent event from propagating
    }
    
    // If we clicked on empty space, deselect any anomaly
    if (!info.object) {
      setSelectedAnomaly(null);
    }
    
    return false;
  }, [drawingMode, handleMapClick]);
  
  return (
    <>
      <DeckGLOverlay 
        layers={layers} 
        onClick={handleClick}
        pickingRadius={5}
      />
      
      {/* Optional: If you want to show anomaly details when selected */}
      {selectedAnomaly !== null && getDrawnArea && getDrawnArea() && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white p-3 rounded-md shadow-lg border border-amber-300 z-10">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium text-amber-800">Anomaly #{selectedAnomaly} Selected</div>
            <button 
              onClick={() => setSelectedAnomaly(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Click on the anomaly points to view detailed information about detected inconsistencies.
          </p>
          <button 
            className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm py-1 px-2 rounded"
            onClick={() => {
              // You can add navigation to a detailed view here
              setSelectedAnomaly(null);
            }}
          >
            View Detailed Report
          </button>
        </div>
      )}
    </>
  );
};

export default DeckGLLayers;