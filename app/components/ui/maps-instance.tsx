import "maplibre-gl/dist/maplibre-gl.css";

import { MapContext } from "./maps-context";
import { cn } from "@/utils/classnames";
import { FC, useRef, useEffect, useContext, forwardRef, useImperativeHandle, ForwardRefRenderFunction } from "react";
import maplibregl, { MapOptions, FlyToOptions, Map } from "maplibre-gl";

export type ViewOptions = Pick<
  FlyToOptions,
  "center" | "bearing" | "pitch" | "zoom"
>;

export type MapInstanceProps = Omit<
  MapOptions,
  "style" | "container" | keyof ViewOptions
> & {
  /**
   * classNames for map instances components
   */
  className?: string;

  /**
   * additional style for map instance
   */
  style?: React.CSSProperties;

  /**
   * map style, see mapbox style spec
   */
  mapStyle?: MapOptions["style"];

  /**
   * handle map view
   */
  mapView?: ViewOptions;

  /**
   * Callback when map is loaded
   */
  onLoad?: (map: Map) => void;
};

/**
 * render maps instance inside provider
 */
const MapInstanceComponent: ForwardRefRenderFunction<Map, MapInstanceProps> = (
  { style, mapView, mapStyle, className, onLoad, ...props },
  ref
) => {
  const ctx = useContext(MapContext);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  // Expose the map instance via forwardRef
  useImperativeHandle(ref, () => {
    if (!mapInstanceRef.current) {
      throw new Error("Map is not initialized");
    }
    return mapInstanceRef.current;
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    const viewOptions: ViewOptions = mapView
      ? Object.entries(mapView).reduce(
          (acc, [key, value]) => {
            if (value !== undefined) acc[key as keyof typeof acc] = value;

            return acc;
          },
          {} as Record<string, unknown>
        )
      : {};

    const map = new maplibregl.Map({
      style: mapStyle,
      container: mapContainer.current,
      ...viewOptions,
      ...props,
    });

    map.on('load', () => {
      if (onLoad) {
        onLoad(map);
      }
      if (ctx?.setMap) {
        ctx.setMap(map);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      style={style}
      ref={mapContainer}
      className={cn("absolute size-full", className)}
    />
  );
};

export const MapInstance = forwardRef(MapInstanceComponent);