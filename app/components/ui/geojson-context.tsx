import React, { createContext, ReactNode, useContext, useState } from "react";

// Type for layer IDs
export type GeoJSONLayerType = string;

export interface GeoJSONLayerInfo {
  id: GeoJSONLayerType;
  name: string;
  color: number[];
  visible: boolean;
}

interface GeoJSONContextType {
  geojsonLayersVisible: boolean;
  toggleGeojsonLayersVisible: () => void;
  geojsonLayers: GeoJSONLayerInfo[];
  toggleGeojsonLayer: (layerId: GeoJSONLayerType) => void;
  setAllGeojsonLayers: (visible: boolean) => void;
}

// Create context for GeoJSON layers
export const GeoJSONContext = createContext<GeoJSONContextType | null>(null);

// Define the 8 initial layers
const initialLayers: GeoJSONLayerInfo[] = [
  // { id: "lulc-2017", name: "LULC 2017", color: [0, 180, 0], visible: true },
  // { id: "lulc-2024", name: "LULC 2024", color: [0, 150, 0], visible: true },
  { id: "carbon-2017", name: "Total Carbon Stocks 2015", color: [100, 200, 100], visible: true },
  { id: "carbon-2024", name: "Total Carbon Stocks 2020", color: [50, 150, 50], visible: true },
  { id: "growth", name: "Forest Growth & Sequestration", color: [0, 200, 50], visible: true },
  { id: "leakage", name: "Leakage Risk", color: [200, 50, 50], visible: true },
  { id: "net-seq", name: "Net Sequestration", color: [0, 150, 150], visible: true },
  { id: "marketable", name: "Marketable Credits", color: [150, 0, 200], visible: true },
  // { id: "carbon-pricing", name: "Carbon Pricing", color: [255, 255, 0], visible: true },
];

interface GeoJSONProviderProps {
  children: ReactNode;
}

export const GeoJSONProvider: React.FC<GeoJSONProviderProps> = ({ children }) => {
  const [geojsonLayersVisible, setGeojsonLayersVisible] = useState<boolean>(true);
  const [geojsonLayers, setGeojsonLayers] = useState<GeoJSONLayerInfo[]>(initialLayers);
  
  // Toggle overall visibility
  const toggleGeojsonLayersVisible = () => {
    setGeojsonLayersVisible(!geojsonLayersVisible);
  };
  
  // Function to toggle layer visibility
  const toggleGeojsonLayer = (layerId: GeoJSONLayerType) => {
    setGeojsonLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible } 
          : layer
      )
    );
  };
  
  // Function to set all layers' visibility at once
  const setAllGeojsonLayers = (visible: boolean) => {
    setGeojsonLayers(prevLayers => 
      prevLayers.map(layer => ({ ...layer, visible }))
    );
  };
  
  // Context value
  const value: GeoJSONContextType = {
    geojsonLayersVisible,
    toggleGeojsonLayersVisible,
    geojsonLayers,
    toggleGeojsonLayer,
    setAllGeojsonLayers
  };
  
  return (
    <GeoJSONContext.Provider value={value}>
      {children}
    </GeoJSONContext.Provider>
  );
};

/**
 * Custom hook to access the GeoJSON context
 * @returns GeoJSONContextType
 */
export const useGeoJSON = (): GeoJSONContextType => {
  const context = useContext(GeoJSONContext);
  
  if (context === null) {
    throw new Error('useGeoJSON must be used within a GeoJSONProvider');
  }
  
  return context;
};

// Also expose the context directly for easier access in other places
useGeoJSON.Context = GeoJSONContext;