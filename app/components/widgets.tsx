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
import { ArrowLeft, Layers, LeafIcon, X } from "lucide-react";
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
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
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

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="flex h-full max-h-svh">
      {/* Left Sidebar for Layer Controls and Legends */}
      {sidebarVisible && (
        <div className="flex flex-col w-64 border-r bg-white h-full max-h-svh">
          <div className="p-2 flex justify-between items-center border-b">
            <h2 className="font-semibold text-sm">Map Controls</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={toggleSidebar}
            >
              <X className="size-4" />
            </Button>
          </div>
          
          {/* Make this div scrollable with fixed height calculation */}
          <div className="p-2 space-y-3 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 40px)' }}>
            {/* GeoJSON Layer Controls */}
            <GeoJSONLayerControl 
              layers={geojsonLayers} 
              toggleLayer={toggleGeojsonLayer} 
              setAllLayers={setAllGeojsonLayers}
            />
            <MetricLayersControl />
            
            {/* LULC Legend */}
            {/* <LULCLegend /> */}
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <Card className="flex flex-col overflow-hidden border-none p-0 flex-1 max-h-svh">
        <CardHeader className="flex flex-row items-center justify-between gap-2 p-2">
          <div className="flex items-center">
            {!sidebarVisible && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mr-2 p-0 h-8 w-8" 
                      onClick={toggleSidebar}
                    >
                      <Layers className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show layer controls</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
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
            <h1 className="font-bold text-base">CarbonNet</h1>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const WidgetDesktop: React.FC = () => {
  return (
    <div className="absolute top-0 right-0 z-10 flex max-h-svh w-full max-w-3xl flex-col overflow-hidden p-2">
      <Content />
    </div>
  );
};

const WidgetMobile: React.FC = () => {
  const [showControls, setShowControls] = useState(false);
  
  return (
    <div className="fixed bottom-0 left-0 z-10 flex w-full flex-row items-center gap-x-2 p-2">
      {/* Layer Controls Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 p-0" 
              onClick={() => setShowControls(!showControls)}
            >
              <Layers className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle layer controls</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Mobile Layer Controls Drawer */}
      {showControls && (
        <Drawer open={showControls} onOpenChange={setShowControls}>
          <DrawerContent>
            <div className="p-4 max-h-96 overflow-y-auto">
              <h2 className="font-semibold mb-3">Map Controls</h2>
              <div className="space-y-3">
                <GeoJSONLayerControl 
                  layers={[]} // We need to pass the real data here
                  toggleLayer={() => {}} 
                  setAllLayers={() => {}}
                />
                <MetricLayersControl />
                <LULCLegend />
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={() => setShowControls(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
      
      {/* Main App Drawer */}
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full gap-x-2">
            <span>CarbonNet</span>
            <LeafIcon className="size-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="flex max-h-[80vh] w-full flex-1 flex-col overflow-hidden">
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