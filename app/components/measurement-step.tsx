import { Button } from "@/components/ui/button";
import { useDrawing } from "@/components/ui/drawing-context";
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineLine
} from "@/components/ui/timeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { FileText } from "lucide-react";
import React from "react";

interface MeasurementStepProps {
  onCreateReport: () => void;
}

const MeasurementStep: React.FC<MeasurementStepProps> = ({ onCreateReport }) => {
  const { carbonMetrics } = useDrawing();

  // Calculate carbon pricing if not available in metrics
  const carbonPricing = carbonMetrics?.marketableCredits || 0;
  return (
    <Timeline positions="left" className="space-y-4">
      <TimelineItem status="done">
        <TimelineDot status="current" />
        <TimelineLine done className="min-h-4" />
        <TimelineContent side="right" className="w-full space-y-2 py-2">
          <div className="prose space-y-2 text-sm">
            <p>
              Your area has been successfully measured and analyzed using our GIS modeling and machine learning classifiers. Here are the carbon measurement results:
            </p>
          </div>
          <div className="space-y-2 rounded-md border p-2 bg-blue-50">
            <div className="font-bold text-sm flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-500 text-white rounded-full w-6 h-6 text-xs">1</div>
              Carbon Stock Baseline
            </div>
            <div>{carbonMetrics?.carbonStocks || 0} tCO<sub>2</sub>e</div>
          </div>
          
          <div className="space-y-2 rounded-md border p-2 bg-blue-50">
            <div className="font-bold text-sm flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-500 text-white rounded-full w-6 h-6 text-xs">2</div>
              Project Forest Growth and Sequestration
            </div>
            <div>{carbonMetrics?.forestGrowth || 0} tCO<sub>2</sub>e</div>
          </div>
          
          <div className="space-y-2 rounded-md border p-2 bg-blue-50">
            <div className="font-bold text-sm flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-500 text-white rounded-full w-6 h-6 text-xs">3</div>
              Leakage and Non-Permanence Risk
            </div>
            <div>{carbonMetrics?.leakage || 0} tCO<sub>2</sub>e</div>
          </div>
          
          <div className="space-y-2 rounded-md border p-2 bg-blue-50">
            <div className="font-bold text-sm flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-500 text-white rounded-full w-6 h-6 text-xs">4</div>
              Net Sequestration
            </div>
            <div>{carbonMetrics?.netSequestration || 0} tCO<sub>2</sub>e</div>
          </div>
          
          {/* <div className="space-y-2 rounded-md border p-2 bg-blue-50">
            <div className="font-bold text-sm flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-500 text-white rounded-full w-6 h-6 text-xs">5</div>
              Marketable Carbon Credits
            </div>
            <div>Rp. {carbonMetrics?.marketableCredits || 0}</div>
          </div> */}
          
          {/* New Carbon Pricing section */}
          <div className="space-y-2 rounded-md border p-2 bg-blue-100">
            <div className="font-bold text-sm flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-xs">
                5
              </div>
              Marketable Carbon Credits
            </div>
            <div className="font-medium text-blue-700">
              Rp. {carbonPricing.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600">
              Based on market rate of Rp 96,000 per marketable credit
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium">Project Area Details</div>
            <div className="rounded-md border p-2">
              <div className="text-sm">Estimated Area</div>
              <div className="font-medium">
                {carbonMetrics?.area || 0}m<sup>2</sup>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
              <p className="font-medium">View on Map</p>
              <p className="mt-1">Use the layer controls in the top-right corner to visualize these metrics on the map. You can toggle individual layers on/off.</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onCreateReport} 
                    className="flex items-center gap-2"
                  >
                    <FileText className="size-4" />
                    <span>Create Report</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate project documentation and reports</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
};

export default MeasurementStep;