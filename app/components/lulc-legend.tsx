import React from 'react';

// LULC classes with their colors
const LULC_CLASSES = [
  { id: 1, name: "Water", color: [0, 100, 255] },
  { id: 2, name: "Trees", color: [0, 180, 0] },
  { id: 4, name: "Flooded Vegetation", color: [0, 150, 130] },
  { id: 5, name: "Crops", color: [255, 255, 0] },
  { id: 7, name: "Built Area", color: [220, 0, 0] },
  { id: 8, name: "Bare Ground", color: [170, 170, 170] },
  { id: 9, name: "Snow/Ice", color: [255, 255, 255] },
  { id: 10, name: "Clouds", color: [200, 200, 255] },
  { id: 11, name: "Rangeland", color: [255, 180, 50] },
];

const LULCLegend: React.FC = () => {
  return (
    <div className="bg-white rounded-md border p-2 shadow-sm">
      <h3 className="text-sm font-medium mb-2">LULC Classes</h3>
      <div className="flex flex-col gap-1">
        {LULC_CLASSES.map(lulc => (
          <div key={lulc.id} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm"
              style={{
                backgroundColor: `rgb(${lulc.color[0]}, ${lulc.color[1]}, ${lulc.color[2]})`
              }}
            />
            <span className="text-xs">{lulc.id}: {lulc.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LULCLegend;