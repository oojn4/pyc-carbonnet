import { DrawingProvider } from "@/components/ui/drawing-context";
import { GeoJSONProvider } from "@/components/ui/geojson-context";
import { MapProvider } from "@/components/ui/maps-context";
import { Widget } from "@/components/widgets";
import { createFileRoute } from "@tanstack/react-router";
import React, { lazy, Suspense } from "react";

const Maps = lazy(() => import("@/components/maps"));
const DeckGLLayers = lazy(() => import("@/components/deckgl"));

export const Route = createFileRoute("/")({
  component: Features,
});

function Features(): React.ReactElement {
  return (
    <MapProvider>
      <GeoJSONProvider>
        <DrawingProvider>
          <div className="relative h-svh w-full">
            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">Loading map layers...</div>}>
              <Maps />
              <DeckGLLayers />
            </Suspense>
          </div>
          <Widget />
        </DrawingProvider>
      </GeoJSONProvider>
    </MapProvider>
  );
}