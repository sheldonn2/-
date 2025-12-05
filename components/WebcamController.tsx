import React, { useEffect, useRef } from 'react';
import { AppState, TreeState } from '../types';

interface WebcamControllerProps {
  appState: AppState;
}

export const WebcamController: React.FC<WebcamControllerProps> = ({ appState }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  
  // To store previous frame data for motion detection
  const prevFrameData = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
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
        appState.setWebcamEnabled(false);
      }
    };

    startWebcam();

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [appState.webcamEnabled]);

  useEffect(() => {
    if (!appState.webcamEnabled) return;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState !== 4) {
          rafRef.current = requestAnimationFrame(processFrame);
          return;
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
      // We must copy the data, otherwise it's a reference
      prevFrameData.current = new Uint8ClampedArray(data);

      // Normalize Motion Logic
      if (changedPixels > 0) {
          motionCenterX /= changedPixels;
          motionCenterY /= changedPixels;
          
          // Map motion center to -1 to 1 for camera control
          // Flip X because webcam is mirrored usually
          const camX = -((motionCenterX / canvas.width) * 2 - 1);
          const camY = -((motionCenterY / canvas.height) * 2 - 1);
          
          appState.setCameraControl({ x: camX, y: camY });
      }

      // Logic: High Motion = Chaos (Unleash), Low Motion = Form
      // Damping the chaos factor change
      const targetChaos = Math.min(motionScore / 1000, 1.0); 
      
      // We want "Open hand" (big motion) to be chaotic, "Closed/Still" to be tree.
      // This motion detector approximates that energy.
      
      // Smooth lerp
      const newChaos = appState.chaosFactor + (targetChaos - appState.chaosFactor) * 0.1;
      
      appState.setChaosFactor(newChaos);
      appState.setTreeState(newChaos > 0.5 ? TreeState.CHAOS : TreeState.FORMED);

      rafRef.current = requestAnimationFrame(processFrame);
    };

    rafRef.current = requestAnimationFrame(processFrame);
  }, [appState.webcamEnabled, appState.chaosFactor]);

  if (!appState.webcamEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity border-2 border-[#FFD700] rounded overflow-hidden">
      <video ref={videoRef} width="160" height="120" className="hidden" muted playsInline />
      <canvas ref={canvasRef} width="160" height="120" className="scale-x-[-1]" />
    </div>
  );
};