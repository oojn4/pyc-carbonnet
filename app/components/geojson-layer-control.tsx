import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GeoJSONLayerInfo, GeoJSONLayerType } from "@/components/ui/geojson-context";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { AlertTriangle, ChevronDown, ChevronUp, LayersIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

interface AnomalyLayerInfo {
  id: string;
  name: string;
  color: number[];
  visible: boolean;
}

interface GeoJSONLayerControlProps {
  layers: GeoJSONLayerInfo[];
  toggleLayer: (layerId: GeoJSONLayerType) => void;
  setAllLayers: (visible: boolean) => void;
}

const GeoJSONLayerControl: React.FC<GeoJSONLayerControlProps> = ({ 
  layers, 
  toggleLayer, 
  setAllLayers 
}) => {
  const [expanded, setExpanded] = useState(true);
  const [anomalyLayers, setAnomalyLayers] = useState<AnomalyLayerInfo[]>([]);
  const [anomalyLayersExpanded, setAnomalyLayersExpanded] = useState(true);

  // Calculate if all layers are visible
  const allVisible = Array.isArray(layers) && layers.length > 0 && layers.every(layer => layer.visible);
  const anyVisible = Array.isArray(layers) && layers.some(layer => layer.visible);

  // Calculate if all anomaly layers are visible
  const allAnomalyVisible = anomalyLayers.length > 0 && anomalyLayers.every(layer => layer.visible);
  
  // Toggle all layers
  const handleToggleAll = () => {
    setAllLayers(!allVisible);
  };

  // Toggle all anomaly layers
  const handleToggleAllAnomalies = () => {
    const newVisibility = !allAnomalyVisible;
    
    // Update local state
    setAnomalyLayers(anomalyLayers.map(layer => ({
      ...layer,
      visible: newVisibility
    })));
    
    // Toggle visibility in the global context
    anomalyLayers.forEach(layer => {
      if (window.toggleAnomalyLayer) {
        window.toggleAnomalyLayer(layer.id, newVisibility);
      }
    });
  };

  // Toggle a single anomaly layer
  const toggleAnomalyLayer = (layerId: string) => {
    setAnomalyLayers(
      anomalyLayers.map(layer => {
        if (layer.id === layerId) {
          // Toggle visibility in global context
          if (window.toggleAnomalyLayer) {
            window.toggleAnomalyLayer(layerId, !layer.visible);
          }
          return {
            ...layer,
            visible: !layer.visible
          };
        }
        return layer;
      })
    );
  };

  // Register the addAnomalyLayer function to window for VerificationStep to use
  useEffect(() => {
    window.addAnomalyLayer = (id: string, name: string, color: number[], visible: boolean) => {
      setAnomalyLayers(prevLayers => {
        // Check if the layer already exists
        const exists = prevLayers.some(layer => layer.id === id);
        if (exists) {
          // Update existing layer
          return prevLayers.map(layer => 
            layer.id === id 
              ? { ...layer, name, color, visible } 
              : layer
          );
        } else {
          // Add new layer
          return [...prevLayers, { id, name, color, visible }];
        }
      });
    };

    // Add toggleAnomalyLayer to window object
    window.toggleAnomalyLayer = (id: string, visible: boolean) => {
      setAnomalyLayers(prevLayers => 
        prevLayers.map(layer => 
          layer.id === id 
            ? { ...layer, visible } 
            : layer
        )
      );
    };

    return () => {
      // Clean up
      delete window.addAnomalyLayer;
      delete window.toggleAnomalyLayer;
    };
  }, []);

  if (!Array.isArray(layers) && anomalyLayers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border p-2 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="size-4 text-blue-600" />
          <span className="text-sm font-medium">Map Layers</span>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{expanded ? "Collapse" : "Expand"} layer controls</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-2 space-y-2">
          {/* GeoJSON layers section */}
          {Array.isArray(layers) && layers.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">GeoJSON Layers</div>
              <div className="flex items-center space-x-2 pl-1">
                <Checkbox 
                  id="all-geojson-layers" 
                  checked={allVisible} 
                  onCheckedChange={handleToggleAll}
                />
                <label htmlFor="all-geojson-layers" className="text-xs font-medium cursor-pointer">
                  Toggle All GeoJSON Layers
                </label>
              </div>
              <Separator className="my-1" />
              {layers.map(layer => (
                <div key={layer.id} className="flex items-center space-x-2 pl-1">
                  <Checkbox 
                    id={`geojson-layer-${layer.id}`}
                    checked={layer.visible}
                    onCheckedChange={() => toggleLayer(layer.id)}
                  />
                  <label 
                    htmlFor={`geojson-layer-${layer.id}`} 
                    className="text-xs cursor-pointer flex items-center"
                  >
                    <div 
                      className="size-3 rounded-sm mr-1"
                      style={{ 
                        backgroundColor: `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, 0.8)` 
                      }}
                    />
                    {layer.name}
                  </label>
                </div>
              ))}
            </div>
          )}
          
          {/* Anomaly layers section */}
          {anomalyLayers.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="size-3" />
                  <span>Anomaly Layers</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 p-0"
                  onClick={() => setAnomalyLayersExpanded(!anomalyLayersExpanded)}
                >
                  {anomalyLayersExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </Button>
              </div>
              
              {anomalyLayersExpanded && (
                <>
                  <div className="flex items-center space-x-2 pl-1">
                    <Checkbox 
                      id="all-anomaly-layers" 
                      checked={allAnomalyVisible} 
                      onCheckedChange={handleToggleAllAnomalies}
                    />
                    <label htmlFor="all-anomaly-layers" className="text-xs font-medium cursor-pointer">
                      Toggle All Anomaly Layers
                    </label>
                  </div>
                  <Separator className="my-1" />
                  {anomalyLayers.map(layer => (
                    <div key={layer.id} className="flex items-center space-x-2 pl-1">
                      <Checkbox 
                        id={`anomaly-layer-${layer.id}`}
                        checked={layer.visible}
                        onCheckedChange={() => toggleAnomalyLayer(layer.id)}
                      />
                      <label 
                        htmlFor={`anomaly-layer-${layer.id}`} 
                        className="text-xs cursor-pointer flex items-center"
                      >
                        <div 
                          className="size-3 rounded-sm mr-1"
                          style={{ 
                            backgroundColor: `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, 0.8)` 
                          }}
                        />
                        {layer.name}
                      </label>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add TypeScript declarations for global functions
declare global {
  interface Window {
    addAnomalyLayer?: (id: string, name: string, color: number[], visible: boolean) => void;
    toggleAnomalyLayer?: (id: string, visible: boolean) => void;
  }
}

export default GeoJSONLayerControl;