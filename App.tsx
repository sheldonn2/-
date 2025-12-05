import React, { useState, Suspense, useEffect } from 'react';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { WebcamController } from './components/WebcamController';
import { AppState, TreeState, PhotoData } from './types';

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);
  const [chaosFactor, setChaosFactor] = useState(0);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [userPhotos, setUserPhotos] = useState<PhotoData[]>([]);
  const [cameraControl, setCameraControl] = useState({ x: 0, y: 0 });
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    // Check for video input devices (camera)
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setHasCamera(videoDevices.length > 0);
        })
        .catch(err => {
            console.warn("Camera check failed:", err);
            setHasCamera(false);
        });
    } else {
        setHasCamera(false);
    }
  }, []);

  const appState: AppState = {
    treeState,
    setTreeState,
    chaosFactor,
    setChaosFactor,
    webcamEnabled,
    setWebcamEnabled,
    userPhotos,
    addPhotos: (photos) => setUserPhotos(prev => [...prev, ...photos]),
    cameraControl,
    setCameraControl,
    hasCamera
  };

  return (
    <div className="relative w-full h-screen bg-[#021a12]">
      {/* 3D Scene Layer */}
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-[#FFD700] luxury-font animate-pulse">
          LOADING CHRISTMAS LUXURY...
        </div>
      }>
        <Scene appState={appState} />
      </Suspense>

      {/* UI Overlay */}
      <Overlay appState={appState} />

      {/* Logic Controller */}
      <WebcamController appState={appState} />
    </div>
  );
}

export default App;