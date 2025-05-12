import { useDrawing } from "@/components/ui/drawing-context";
import { useMap } from "@/components/ui/maps-context";
import { MapInstance } from "@/components/ui/maps-instance";
import { Map } from "maplibre-gl";
import React, { useEffect } from "react";

const Maps: React.FC = () => {
  const { map, setMap } = useMap();
  const { drawingMode } = useDrawing();
  
  // Handle cursor style based on drawing mode
  useEffect(() => {
    if (map) {
      const canvas = map._canvas;
      if (canvas) {
        canvas.style.cursor = drawingMode ? 'crosshair' : '';
      }
    }
  }, [map, drawingMode]);
  
  // Handle map load and set in context
  const handleMapLoad = (map: Map) => {
    setMap(map);
  };
  
  return (
    <MapInstance
      attributionControl={false}
      className="absolute top-0 left-0 size-full"
      mapStyle="https://api.maptiler.com/maps/hybrid/style.json?key=O7PAbzskDTxUmuyVGvJ0"
      mapView={{ center: [101.4383, 0.5104], zoom: 9 }}
      onLoad={handleMapLoad}
    />
  );
};

export default Maps;