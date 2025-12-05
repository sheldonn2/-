import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { LuxuryTree } from './LuxuryTree';
import { AppState } from '../types';
import * as THREE from 'three';

const CameraController = ({ appState }: { appState: AppState }) => {
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  useFrame(() => {
    // If webcam control is active, slightly offset camera
    // cameraControl x/y are -1 to 1
    const { x, y } = appState.cameraControl;
    
    // Smoothly interpolate current camera position to target offset
    // Base position: [0, 4, 20]
    const targetX = x * 10;
    const targetY = 4 + (y * 5);
    
    // We don't want to override orbit controls completely, 
    // but adds a "parallax" feel or "hand-guided" look
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    
    camera.lookAt(0, 0, 0);
  });
  return null;
};

export const Scene: React.FC<{ appState: AppState }> = ({ appState }) => {
  return (
    <Canvas
      camera={{ position: [0, 4, 20], fov: 45 }}
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#021a12']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} color="#043927" />
      <pointLight position={[10, 10, 10]} intensity={2} color="#FFD700" />
      <spotLight position={[-10, 20, 10]} angle={0.3} penumbra={1} intensity={3} color="#ffffff" castShadow />
      
      {/* Environment */}
      <Environment preset="lobby" blur={0.8} />

      {/* The Tree */}
      <LuxuryTree appState={appState} />

      {/* Camera Logic */}
      <CameraController appState={appState} />
      
      {/* If webcam is NOT defining the view completely, allow orbit */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={10} 
        maxDistance={40}
        maxPolarAngle={Math.PI / 1.5}
        // If chaos is high (unleashed), maybe auto-rotate?
        autoRotate={appState.chaosFactor > 0.8}
        autoRotateSpeed={2.0}
      />

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </Canvas>
  );
};