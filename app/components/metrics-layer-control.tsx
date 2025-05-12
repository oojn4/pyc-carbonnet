import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDrawing } from "@/components/ui/drawing-context";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, LayersIcon } from "lucide-react";
import React, { useState } from "react";

const MetricLayersControl: React.FC = () => {
  const { metricLayers, toggleMetricLayer, setAllMetricLayers } = useDrawing();
  const [expanded, setExpanded] = useState(false);

  // Calculate if all layers are visible
  const allVisible = metricLayers.every(layer => layer.visible);
  const anyVisible = metricLayers.some(layer => layer.visible);

  // Toggle all layers
  const handleToggleAll = () => {
    setAllMetricLayers(!allVisible);
  };

  return (
    <div className="rounded-md border p-2 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="size-4 text-green-600" />
          <span className="text-sm font-medium">Metric Layers</span>
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
        <div className="mt-2 space-y-1">
          <div className="flex items-center space-x-2 pl-1">
            <Checkbox 
              id="all-layers" 
              checked={allVisible} 
              onCheckedChange={handleToggleAll}
            />
            <label htmlFor="all-layers" className="text-xs font-medium cursor-pointer">
              Toggle All Layers
            </label>
          </div>
          <Separator className="my-1" />
          {metricLayers.map(layer => (
            <div key={layer.id} className="flex items-center space-x-2 pl-1">
              <Checkbox 
                id={`layer-${layer.id}`}
                checked={layer.visible}
                onCheckedChange={() => toggleMetricLayer(layer.id)}
              />
              <label 
                htmlFor={`layer-${layer.id}`} 
                className="text-xs cursor-pointer flex items-center"
              >
                <div 
                  className="size-3 rounded-sm mr-1"
                  style={{ 
                    backgroundColor: `rgba(${layer.color[0]}, ${layer.color[1]}, ${layer.color[2]}, ${layer.color[3]/255})` 
                  }}
                />
                {layer.name}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MetricLayersControl;