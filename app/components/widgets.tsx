import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useDrawing } from "@/components/ui/drawing-context";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { ArrowLeft, LeafIcon } from "lucide-react";
import React, { useState } from "react";

import DrawStep from "@/components/draw-step";
import GeoJSONLayerControl from "@/components/geojson-layer-control";
import LULCLegend from "@/components/lulc-legend";
import MeasurementStep from "@/components/measurement-step";
import MetricLayersControl from "@/components/metrics-layer-control";
import ReportStep from "@/components/report-step";
import VerificationStep from "@/components/verification-step";
import { useGeoJSON } from "./ui/geojson-context";

// Types 
type Step = "draw" | "measurement" | "report" | "verification";

const Content: React.FC = () => {
  const [step, setStep] = useState<Step>("draw");
  
  const { 
    drawingMode, 
    endDrawingMode, 
    clearDrawings,
    carbonMetrics
  } = useDrawing();

   // Safely use GeoJSON context or provide fallback
  let geojsonLayers: any[] = [];
  let toggleGeojsonLayer = (_id: string) => {};
  let setAllGeojsonLayers = (_visible: boolean) => {};
  
  try {
    // Try to use the GeoJSON context, but don't fail if it's not available
    const geoJSONContext = useGeoJSON();
    if (geoJSONContext) {
      geojsonLayers = geoJSONContext.geojsonLayers || [];
      toggleGeojsonLayer = geoJSONContext.toggleGeojsonLayer;
      setAllGeojsonLayers = geoJSONContext.setAllGeojsonLayers;
    }
  } catch (error) {
    console.warn("GeoJSON context not available in Widget");
  }

  // Back button handler
  const handleBack = () => {
    // If we're in drawing mode, exit it first
    if (drawingMode) {
      endDrawingMode();
    }
    
    // Go back to the previous step
    if (step === "measurement") {
      setStep("draw");
      // Clear the drawn area for a fresh start
      clearDrawings();
    } else if (step === "report") {
      setStep("measurement");
    } else if (step === "verification") {
      setStep("report");
    }
  };

  // Step transition handlers
  const handleCompleteDraw = () => {
    setStep("measurement");
  };

  const handleCreateReport = () => {
    setStep("report");
  };

  const handleProceedToVerification = () => {
    setStep("verification");
  };

  // Determine if we should show the metrics layers control
  const showMetricsControl = carbonMetrics && !drawingMode;

  return (
    <Card className="flex flex-col overflow-hidden border-none p-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-2">
        <div className="flex items-center">
          {step !== "draw" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mr-2 p-0 h-8 w-8" 
                    onClick={handleBack}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go back to previous step</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <h1 className="font-bold text-base">Carbon Sensing AI</h1>
        </div>
        
        <div className="flex-shrink-0 flex gap-2">
          {/* Always show GeoJSON layer controls */}
          <GeoJSONLayerControl layers={geojsonLayers} toggleLayer={toggleGeojsonLayer} setAllLayers={setAllGeojsonLayers}/>
          
          {/* Only show metrics layer control after drawing */}
          {showMetricsControl && (
            <MetricLayersControl />
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-2 overflow-auto p-2">
          {/* Draw Area Step */}
          {step === "draw" && (
            <DrawStep onCompleteDraw={handleCompleteDraw} />
          )}

          {/* Measurement Step */}
          {step === "measurement" && (
            <MeasurementStep onCreateReport={handleCreateReport} />
          )}

          {/* Report Step */}
          {step === "report" && (
            <ReportStep onProceedToVerification={handleProceedToVerification} />
          )}

          {/* Verification Step */}
          {step === "verification" && (
            <VerificationStep />
          )}
          
          {/* Always show LULC Legend */}
          <LULCLegend />
        </div>
      </CardContent>
    </Card>
  );
};

const WidgetDesktop: React.FC = () => {
  return (
    <div className="absolute top-0 right-0 z-10 flex max-h-svh w-full max-w-lg flex-col space-y-2 overflow-hidden p-2">
      <Content />
    </div>
  );
};

const WidgetMobile: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 z-10 flex w-full flex-row items-center gap-x-2 p-2">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full gap-x-2">
            <span>Carbon Sensing</span>
            <LeafIcon className="size-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="flex max-h-svh w-svw flex-1 flex-col overflow-hidden">
            <Content />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export const Widget: React.FC = () => {
  return (
    <div>
      <div className="hidden md:flex">
        <WidgetDesktop />
      </div>
      <div className="md:hidden">
        <WidgetMobile />
      </div>
    </div>
  );
};