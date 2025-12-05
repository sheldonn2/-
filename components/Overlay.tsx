import React, { useRef, CSSProperties } from 'react';
import { AppState, TreeState } from '../types';

interface OverlayProps {
  appState: AppState;
}

export const Overlay: React.FC<OverlayProps> = ({ appState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const newPhotos = files.map(file => ({
        id: URL.createObjectURL(file), // Using object URL as ID for simplicity
        url: URL.createObjectURL(file),
        aspectRatio: 1 // Default, will look better if actual ratio is calculated but 1 is safe
      }));
      appState.addPhotos(newPhotos);
    }
  };

  const verticalTextStyle: CSSProperties = { writingMode: 'vertical-rl' };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden text-[#FFD700] select-none">
      
      {/* 1. Header / Title - Top Left */}
      <header className="absolute top-8 left-8 pointer-events-auto text-left">
        <h1 className="text-4xl md:text-6xl font-bold luxury-font tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
          豪华互动<br/>圣诞树
        </h1>
        <p className="text-[#C0C0C0] mt-2 text-xs md:text-sm tracking-[0.3em] uppercase opacity-80 pl-1">
          沉浸式 3D 体验
        </p>
      </header>

      {/* 2. Webcam Toggle - Top Right (If Camera Available) */}
      {appState.hasCamera && (
        <div className="absolute top-8 right-8 pointer-events-auto flex flex-col items-end gap-3">
            <div className="flex items-center gap-3 bg-[#000000]/30 backdrop-blur-md p-2 rounded-lg border border-[#FFD700]/20">
                <span className="text-xs uppercase tracking-wide font-bold text-[#FFD700]">手势控制 (摄像头)</span>
                <button
                  onClick={() => appState.setWebcamEnabled(!appState.webcamEnabled)}
                  className={`px-4 py-1 rounded-md border text-xs font-bold transition-all ${
                    appState.webcamEnabled 
                    ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_10px_#FFD700]' 
                    : 'bg-transparent text-[#FFD700] border-[#FFD700] hover:bg-[#FFD700]/20'
                  }`}
                >
                  {appState.webcamEnabled ? '开启' : '关闭'}
                </button>
            </div>
             {appState.webcamEnabled && (
                 <div className="text-[10px] text-right text-[#C0C0C0] bg-black/50 p-2 rounded max-w-[180px]">
                     👋 挥手 = 释放 (Unleash)<br/>
                     ✊ 静止 = 成型 (Formed)
                 </div>
             )}
        </div>
      )}

      {/* 3. Vertical Slider - Right Center (Only if Webcam OFF) */}
      {!appState.webcamEnabled && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col items-center gap-6 py-6 w-16 bg-[#000000]/20 backdrop-blur-sm rounded-full border border-[#FFD700]/20 shadow-xl transition-opacity duration-500">
          <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest" style={verticalTextStyle}>
            释放 (Unleash)
          </span>
          
          <div className="h-48 flex items-center justify-center w-full relative">
               {/* Rotated Input */}
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
                className="absolute w-48 h-2 bg-[#043927] rounded-lg appearance-none cursor-pointer accent-[#FFD700] -rotate-90 origin-center shadow-inner"
                />
          </div>

          <span className="text-xs font-bold text-[#FFD700] uppercase tracking-widest" style={verticalTextStyle}>
             成型 (Formed)
          </span>
        </div>
      )}

      {/* 4. Photo Upload Button - Bottom Right */}
      <div className="absolute bottom-8 right-8 pointer-events-auto">
        <button
            onClick={() => fileInputRef.current?.click()}
            className="group flex items-center gap-3 px-6 py-3 bg-[#043927]/90 hover:bg-[#064e35] text-[#FFD700] border border-[#FFD700] rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] transition-all duration-300 backdrop-blur-md transform hover:-translate-y-1"
        >
             <span className="text-2xl group-hover:rotate-12 transition-transform">📷</span>
             <div className="flex flex-col items-start">
                <span className="text-sm font-bold uppercase tracking-widest leading-none">添加美好回忆</span>
                <span className="text-[10px] opacity-60 uppercase tracking-wider mt-1">上传照片</span>
             </div>
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

      {/* 5. Footer / Instructions - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none w-full max-w-lg">
           {!appState.webcamEnabled && (
               <p className="text-sm text-[#FFD700] mb-3 drop-shadow-md animate-pulse">
                   拖动滑块变形 • 鼠标拖动视角
               </p>
           )}
           <div className="text-[10px] text-[#C0C0C0] opacity-50 tracking-[0.3em] font-serif">
                圣诞快乐 • 3D 互动体验 • REACT 19
           </div>
      </div>
    </div>
  );
};