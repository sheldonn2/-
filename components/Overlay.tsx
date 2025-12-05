import React, { useRef } from 'react';
import { AppState, TreeState } from '../types';

interface OverlayProps {
  appState: AppState;
}

export const Overlay: React.FC<OverlayProps> = ({ appState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPhotos = files.map(file => ({
        id: URL.createObjectURL(file), // Using object URL as ID for simplicity
        url: URL.createObjectURL(file),
        aspectRatio: 1 // Default, will look better if actual ratio is calculated but 1 is safe
      }));
      appState.addPhotos(newPhotos);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
      {/* Header */}
      <header className="flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-[#FFD700] luxury-font tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          THE GRAND TREE
        </h1>
        <p className="text-[#C0C0C0] mt-2 text-sm md:text-base tracking-widest uppercase opacity-80">
          Luxury Interactive Experience
        </p>
      </header>

      {/* Controls Container */}
      <div className="pointer-events-auto flex flex-col items-center gap-6 w-full max-w-md mx-auto bg-[#000000]/40 backdrop-blur-md p-6 rounded-lg border border-[#FFD700]/30 shadow-2xl">
        
        {/* Toggle Webcam (Only if Camera detected) */}
        {appState.hasCamera ? (
          <div className="flex items-center gap-4 w-full justify-between">
            <span className="text-[#fceabb] text-sm uppercase tracking-wide">Gesture Control (Camera)</span>
            <button
              onClick={() => appState.setWebcamEnabled(!appState.webcamEnabled)}
              className={`px-4 py-1 rounded-full border text-xs font-bold transition-all ${
                appState.webcamEnabled 
                ? 'bg-[#FFD700] text-black border-[#FFD700]' 
                : 'bg-transparent text-[#FFD700] border-[#FFD700] hover:bg-[#FFD700]/20'
              }`}
            >
              {appState.webcamEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        ) : (
           <div className="w-full text-center p-2 border border-[#FFD700]/10 rounded bg-[#000000]/20">
              <span className="text-[#C0C0C0]/50 text-xs uppercase tracking-wide">Camera not available</span>
           </div>
        )}

        {/* Manual Slider (Only if webcam off or unavailable) */}
        {!appState.webcamEnabled && (
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between text-xs text-[#FFD700] uppercase font-bold">
              <span>Formed</span>
              <span>Unleashed</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={appState.chaosFactor}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                appState.setChaosFactor(val);
                appState.setTreeState(val > 0.5 ? TreeState.CHAOS : TreeState.FORMED);
              }}
              className="w-full h-2 bg-[#043927] rounded-lg appearance-none cursor-pointer accent-[#FFD700]"
            />
          </div>
        )}

        {/* Instructions */}
        <div className="text-center">
             <p className="text-xs text-[#C0C0C0] italic">
               {appState.webcamEnabled 
                 ? "Wave your hands to UNLEASH chaos. Hold still to FORM the tree." 
                 : "Use the slider to transition. Drag to rotate."}
             </p>
        </div>

        {/* Photo Upload */}
        <div className="w-full border-t border-[#FFD700]/20 pt-4 mt-2">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-[#043927] hover:bg-[#064e35] text-[#FFD700] border border-[#FFD700] uppercase text-xs font-bold tracking-widest transition-colors duration-300"
            >
                Add Memories (Photos)
            </button>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
            />
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center opacity-50 text-[10px] text-[#FFD700]">
        MERRY CHRISTMAS • INTERACTIVE 3D • REACT 19
      </div>
    </div>
  );
};