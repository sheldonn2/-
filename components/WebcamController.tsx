import React, { useEffect, useRef } from 'react';
import { AppState, TreeState } from '../types';

interface WebcamControllerProps {
  appState: AppState;
}

export const WebcamController: React.FC<WebcamControllerProps> = ({ appState }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  
  // Store latest appState in a ref to access it inside the animation loop
  // without triggering a useEffect restart.
  const appStateRef = useRef(appState);

  // Sync ref with props on every render
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);
  
  // To store previous frame data for motion detection
  const prevFrameData = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    // Only run this effect when webcamEnabled status changes
    if (!appState.webcamEnabled) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240, frameRate: 30 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Webcam access denied", err);
        // Access state via ref to be safe, though setWebcamEnabled is stable usually
        appStateRef.current.setWebcamEnabled(false);
      }
    };

    startWebcam();

    // Loop function
    const processFrame = () => {
      // Access latest state
      const currentAppState = appStateRef.current;
      
      if (!currentAppState.webcamEnabled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // If video not ready, keep trying
      if (!video || !canvas || video.readyState !== 4) {
          rafRef.current = requestAnimationFrame(processFrame);
          return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get pixel data
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const length = data.length;

      let motionScore = 0;
      let motionCenterX = 0;
      let motionCenterY = 0;
      let changedPixels = 0;

      // Compare with previous frame
      if (prevFrameData.current) {
        const prev = prevFrameData.current;
        const skip = 4 * 4; // Check every 4th pixel to save CPU
        
        for (let i = 0; i < length; i += skip) {
          // Simple difference check (R+G+B)
          const rDiff = Math.abs(data[i] - prev[i]);
          const gDiff = Math.abs(data[i+1] - prev[i+1]);
          const bDiff = Math.abs(data[i+2] - prev[i+2]);
          
          if (rDiff + gDiff + bDiff > 50) { // Threshold
             motionScore += 1;
             
             // Calculate approximate center of motion
             const pixelIndex = i / 4;
             const x = pixelIndex % canvas.width;
             const y = Math.floor(pixelIndex / canvas.width);
             
             motionCenterX += x;
             motionCenterY += y;
             changedPixels++;
          }
        }
      }

      // Store current frame
      prevFrameData.current = new Uint8ClampedArray(data);

      // Normalize Motion Logic
      if (changedPixels > 0) {
          motionCenterX /= changedPixels;
          motionCenterY /= changedPixels;
          
          // Map motion center to -1 to 1 for camera control
          // Flip X because webcam is mirrored usually
          const camX = -((motionCenterX / canvas.width) * 2 - 1);
          const camY = -((motionCenterY / canvas.height) * 2 - 1);
          
          currentAppState.setCameraControl({ x: camX, y: camY });
      }

      // Logic: High Motion = Chaos (Unleash), Low Motion = Form
      const targetChaos = Math.min(motionScore / 1000, 1.0); 
      
      // Smooth lerp
      const newChaos = currentAppState.chaosFactor + (targetChaos - currentAppState.chaosFactor) * 0.1;
      
      // Only update if change is significant to avoid thrashing renders too hard
      if (Math.abs(newChaos - currentAppState.chaosFactor) > 0.001) {
          currentAppState.setChaosFactor(newChaos);
          currentAppState.setTreeState(newChaos > 0.5 ? TreeState.CHAOS : TreeState.FORMED);
      }

      rafRef.current = requestAnimationFrame(processFrame);
    };

    // Start loop
    rafRef.current = requestAnimationFrame(processFrame);

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [appState.webcamEnabled]); // ONLY re-run if toggle changes

  if (!appState.webcamEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity border-2 border-[#FFD700] rounded overflow-hidden pointer-events-none">
      <video ref={videoRef} width="160" height="120" className="hidden" muted playsInline />
      <canvas ref={canvasRef} width="160" height="120" className="scale-x-[-1]" />
    </div>
  );
};