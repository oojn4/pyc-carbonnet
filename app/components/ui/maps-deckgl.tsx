import { useMap } from "@/components/ui/maps-context";
import { MapboxOverlay, MapboxOverlayProps } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

interface DeckGLOverlayProps extends MapboxOverlayProps {
  onClick?: (info: any, event: any) => boolean | void;
}

/**
 * deckgl overlay layer in maplibre
 */
export const DeckGLOverlay: React.FC<DeckGLOverlayProps> = (props) => {
  const { map } = useMap();
  const overlayRef = useRef<maplibregl.IControl | null>(null);

  useEffect(() => {
    if (!map) return;

    const handleOverlayUpdate = () => {
      // If there's an existing overlay, remove it
      if (overlayRef.current && map.hasControl(overlayRef.current)) {
        map.removeControl(overlayRef.current);
      }

      try {
        // Create new overlay with current props
        const overlay = new MapboxOverlay(props) as maplibregl.IControl;
        overlayRef.current = overlay;

        // Add the new overlay to the map
        map.addControl(overlay);
      } catch (error) {
        console.error("Error creating MapboxOverlay:", error);
      }
    };

    // Handle the overlay update
    handleOverlayUpdate();

    // Cleanup function
    return () => {
      try {
        if (map && overlayRef.current && map.hasControl(overlayRef.current)) {
          map.removeControl(overlayRef.current);
        }
      } catch (error) {
        console.error("Error removing overlay:", error);
      }
    };
  }, [map, props.layers]);

  return null;
};