import { Button } from "@/components/ui/button";
import { useDrawing } from "@/components/ui/drawing-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { PencilIcon, Save } from "lucide-react";
import React from "react";

interface DrawStepProps {
  onCompleteDraw: () => void;
}

const DrawStep: React.FC<DrawStepProps> = ({ onCompleteDraw }) => {
  const { 
    drawingMode, 
    startDrawingMode, 
    endDrawingMode
  } = useDrawing();

  const handleStartDrawing = (): void => {
    if (drawingMode) return;
    startDrawingMode();
  };

  const handleSaveArea = (): void => {
    if (!drawingMode) return;
    
    // End drawing mode
    endDrawingMode();
    
    // Notify parent that drawing is complete
    onCompleteDraw();
  };

  return (
    <div className="flex flex-col space-y-4 p-2">
      <div className="prose space-y-2 text-sm">
        <p>
          Please draw the area on the map to begin carbon measurement.
        </p>
      </div>
      {!drawingMode ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleStartDrawing} 
                className="flex items-center gap-2"
              >
                <PencilIcon className="size-4" />
                <span>Draw Area on Map</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start drawing a polygon area on the map</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
            <p className="font-medium">Drawing Mode Active</p>
            <p className="mt-1">Click points on the map to draw your area. Create at least 3 points to form a polygon.</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSaveArea}
                  className="flex items-center gap-2 w-full"
                  variant={"default"}
                >
                  <Save className="size-4" />
                  <span>Save Area</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Complete drawing and calculate carbon metrics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

export default DrawStep;