import { Layer } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";
import { GeoJSONFeature } from "maplibre-gl";

// LULC color mapping
const LULC_COLORS = {
  1: [0, 100, 255], // Water - Blue
  2: [0, 180, 0],   // Trees - Green
  4: [0, 150, 130], // Flooded Vegetation - Teal
  5: [255, 255, 0], // Crops - Yellow
  7: [220, 0, 0],   // Built Area - Red
  8: [170, 170, 170], // Bare Ground - Gray
  9: [255, 255, 255], // Snow/Ice - White
  10: [200, 200, 255], // Clouds - Light Blue
  11: [255, 180, 50], // Rangeland - Orange
};

// Define layer configurations
const LAYER_CONFIGS = [
  // {
  //   id: "lulc-2017",
  //   name: "LULC 2017",
  //   accessor: (f: any) => f.properties?.lulc_2017_majority || 0,
  //   getColor: (val: number) => LULC_COLORS[val as keyof typeof LULC_COLORS] || [100, 100, 100],
  // },
  // {
  //   id: "lulc-2024",
  //   name: "LULC 2024",
  //   accessor: (f: any) => f.properties?.lulc_2024_majority || 0,
  //   getColor: (val: number) => LULC_COLORS[val as keyof typeof LULC_COLORS] || [100, 100, 100],
  // },
  {
    id: "carbon-2017",
    name: "Total Carbon Stocks 2015",
    accessor: (f: any) => f.properties?.total_carbon_2017_sum || 0,
    getColor: (val: number) => {
      const maxCarbon = 2000000;
      const intensity = Math.min(1, val / maxCarbon);
      return [0, Math.round(100 + intensity * 155), 0];
    },
  },
  {
    id: "carbon-2024",
    name: "Total Carbon Stocks 2020",
    accessor: (f: any) => f.properties?.total_carbon_2024_sum || 0,
    getColor: (val: number) => {
      const maxCarbon = 2000000;
      const intensity = Math.min(1, val / maxCarbon);
      return [0, Math.round(100 + intensity * 155), 0];
    },
  },
  {
    id: "growth",
    name: "Forest Growth & Sequestration",
    accessor: (f: any) => (f.properties?.total_carbon_2024_sum || 0) - (f.properties?.total_carbon_2017_sum || 0),
    getColor: (val: number) => {
      if (val > 0) {
        const intensity = Math.min(1, val / 100000);
        return [0, Math.round(150 + intensity * 105), 0];
      } else {
        const intensity = Math.min(1, Math.abs(val) / 100000);
        return [0, 0, Math.round(150 + intensity * 105)];
      }
    },
  },
  {
    id: "leakage",
    name: "Leakage & Non-Permanence Risk",
    accessor: (f: any) => {
      const growth = (f.properties?.total_carbon_2024_sum || 0) - (f.properties?.total_carbon_2017_sum || 0);
      return growth * 0.1;
    },
    getColor: (val: number) => {
      const intensity = Math.min(1, Math.abs(val) / 10000);
      return [Math.round(150 + intensity * 105), 0, 0];
    },
  },
  {
    id: "net-seq",
    name: "Net Sequestration",
    accessor: (f: any) => {
      const growth = (f.properties?.total_carbon_2024_sum || 0) - (f.properties?.total_carbon_2017_sum || 0);
      return growth * 0.05;
    },
    getColor: (val: number) => {
      const intensity = Math.min(1, Math.abs(val) / 5000);
      return [0, Math.round(100 + intensity * 155), Math.round(100 + intensity * 155)];
    },
  },
  {
    id: "marketable",
    name: "Marketable Carbon Credits",
    accessor: (f: any) => {
      const growth = (f.properties?.total_carbon_2024_sum || 0) - (f.properties?.total_carbon_2017_sum || 0);
      const leakage = growth * 0.1;
      const netSeq = growth * 0.05;
      return growth - leakage - netSeq;
    },
    getColor: (val: number) => {
      const intensity = Math.min(1, val / 100000);
      return [Math.round(100 + intensity * 155), 0, Math.round(150 + intensity * 105)];
    },
  },
  // {
  //   id: "carbon-pricing",
  //   name: "Carbon Pricing (USD)",
  //   accessor: (f: any) => {
  //     const growth = (f.properties?.total_carbon_2024_sum || 0) - (f.properties?.total_carbon_2017_sum || 0);
  //     const leakage = growth * 0.1;
  //     const netSeq = growth * 0.05;
  //     const marketableCredits = growth - leakage - netSeq;
  //     return marketableCredits * 96000; // Calculate carbon pricing
  //   },
  //   getColor: (val: number) => {
  //     const maxPrice = 100000000; // 100 million
  //     const intensity = Math.min(1, val / maxPrice);
  //     return [50, 150, Math.round(200 + intensity * 55)]; // Blue color gradient
  //   },
  // }
];

// Create a placeholder empty FeatureCollection for layers without data
const EMPTY_GEOJSON = {
  type: 'FeatureCollection',
  features: []
};

// Function to create GeoJSON layers - completely static, no hooks
function createGeoJSONLayers(options: {
  data?: any;
  visible?: boolean;
  visibleLayers?: Array<{ id: string; visible: boolean }>;
}): Layer[] {
  try {
    const { data, visible = true, visibleLayers = [] } = options;
    
    // If not visible, return empty array
    if (!visible) {
      return [];
    }
    
    // Make sure visibleLayers is an array
    if (!Array.isArray(visibleLayers)) {
      return [];
    }
    
    // Get list of visible layer IDs
    const visibleLayerIds = visibleLayers
      .filter(l => l && typeof l === 'object' && 'id' in l && 'visible' in l && l.visible)
      .map(l => l.id);
    
    // Filter layer configs based on visibility
    const activeConfigs = LAYER_CONFIGS.filter(config => 
      visibleLayerIds.includes(config.id)
    );
    
    // Use data if provided, otherwise use empty GeoJSON
    const geoJsonData = data || EMPTY_GEOJSON;
    
    return activeConfigs.map((config, index) => {
      return new GeoJsonLayer({
        id: `geojson-${config.id}`,
        data: geoJsonData,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        lineWidthScale: 1,
        lineWidthMinPixels: 1,
        getFillColor: (feature) => {
          const value = config.accessor(feature as unknown as GeoJSONFeature);
          const color = config.getColor(value);
          return Uint8ClampedArray.from([...color, 180]); // Add alpha
        },
        getLineColor: [80, 80, 80, 255],
        getElevation: 0,
        // Stack layers with z-index to avoid z-fighting
        getPolygonOffset: ({ layerIndex }) => [-layerIndex * 10, -layerIndex * 10]
      });
    });
  } catch (err) {
    console.error("Error creating GeoJSON layers:", err);
    return [];
  }
}

// Export the layer configs for use in UI components
export const getLayerConfigs = () => LAYER_CONFIGS;

// Export the main function
export default createGeoJSONLayers;