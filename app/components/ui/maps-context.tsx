import { Map } from "maplibre-gl";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface MapContextType {
  map: Map | null;
  setMap: (map: Map) => void;
}

// Create map context with default values
const defaultValue: MapContextType = {
  map: null,
  setMap: () => {} // No-op default
};

export const MapContext = createContext<MapContextType>(defaultValue);

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [map, setMap] = useState<Map | null>(null);
  
  // Context value
  const value: MapContextType = {
    map,
    setMap
  };
  
  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

/**
 * Custom hook to access the map context
 * @returns MapContextType
 */
export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  
  return context;
};