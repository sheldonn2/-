import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture, Center } from '@react-three/drei';
import { SparkleMaterial } from './Shaders';
import { AppState, Vector3 } from '../types';

// Register the custom shader material
extend({ SparkleMaterial });

interface LuxuryTreeProps {
  appState: AppState;
}

const TREE_HEIGHT = 18;
const TREE_RADIUS = 7;
const PARTICLE_COUNT = 3000;
const ORNAMENT_COUNT = 400; // Increased for more luxury

// Helper: Generate Random Point in Sphere (Chaos)
const randomInSphere = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Helper: Generate Point on Cone Surface (Tree)
const randomOnCone = (height: number, radius: number) => {
  const y = Math.random() * height; // 0 to height
  const r = (radius * (height - y)) / height; // Radius at height y
  const theta = Math.random() * 2 * Math.PI;
  
  // Add some thickness to the tree
  const thickness = Math.random() * 2; 
  
  return new THREE.Vector3(
    (r + thickness) * Math.cos(theta),
    y - height / 2, // Center vertically
    (r + thickness) * Math.sin(theta)
  );
};

export const LuxuryTree: React.FC<LuxuryTreeProps> = ({ appState }) => {
  const { viewport } = useThree((state) => state);
  const materialRef = useRef<any>(null);

  // --- 1. Foliage / Needles (Particles) ---
  const particlesData = useMemo(() => {
    const chaosPositions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Chaos Position (Exploded)
      const chaos = randomInSphere(15);
      chaosPositions[i * 3] = chaos.x;
      chaosPositions[i * 3 + 1] = chaos.y;
      chaosPositions[i * 3 + 2] = chaos.z;

      // Tree Position (Formed)
      const tree = randomOnCone(TREE_HEIGHT, TREE_RADIUS);
      targetPositions[i * 3] = tree.x;
      targetPositions[i * 3 + 1] = tree.y;
      targetPositions[i * 3 + 2] = tree.z;

      sizes[i] = Math.random() * 0.5 + 0.2;
      speeds[i] = Math.random();
    }

    return { chaosPositions, targetPositions, sizes, speeds };
  }, []);

  // --- 2. Ornaments Data ---
  const ornamentsData = useMemo(() => {
    return new Array(ORNAMENT_COUNT).fill(0).map(() => {
      const chaos = randomInSphere(20);
      const tree = randomOnCone(TREE_HEIGHT, TREE_RADIUS + 0.5); // Slightly outside foliage
      const type = Math.random() > 0.7 ? 'gift' : (Math.random() > 0.5 ? 'ball' : 'light');
      const color = type === 'gift' 
        ? '#D4AF37' // Gold
        : type === 'ball' 
          ? (Math.random() > 0.5 ? '#C0C0C0' : '#d1001c') // Silver or Red
          : '#fffae3'; // Warm light

      return {
        chaosPos: chaos,
        targetPos: tree,
        type,
        color,
        scale: type === 'gift' ? 1.5 : (type === 'ball' ? 0.8 : 0.3),
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as Vector3
      };
    });
  }, []);
  
  // --- 3. Animation Loop ---
  useFrame((state) => {
    // Update Shader Uniforms
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      // Lerp the chaos factor for smooth transition
      const targetChaos = appState.chaosFactor;
      materialRef.current.uChaos = THREE.MathUtils.lerp(materialRef.current.uChaos, targetChaos, 0.05);
    }
  });

  return (
    <group>
      {/* 1. The Foliage System */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlesData.chaosPositions.length / 3}
            array={particlesData.chaosPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aTargetPos"
            count={particlesData.targetPositions.length / 3}
            array={particlesData.targetPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aSize"
            count={particlesData.sizes.length}
            array={particlesData.sizes}
            itemSize={1}
          />
           <bufferAttribute
            attach="attributes-aSpeed"
            count={particlesData.speeds.length}
            array={particlesData.speeds}
            itemSize={1}
          />
        </bufferGeometry>
        {/* @ts-ignore - Custom Shader Material */}
        <sparkleMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uPixelRatio={viewport.dpr}
        />
      </points>

      {/* 2. Instanced Ornaments */}
      <OrnamentInstances 
        data={ornamentsData} 
        currentChaos={appState.chaosFactor} 
        photos={appState.userPhotos}
      />

      {/* 3. The Grand Star */}
      <Star chaos={appState.chaosFactor} />
    </group>
  );
};

// --- Star Component ---
const Star = ({ chaos }: { chaos: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const haloRef = useRef<THREE.Mesh>(null);

    // Target is the top of the tree (Height/2)
    const [targets] = useState(() => ({
        targetPos: new THREE.Vector3(0, TREE_HEIGHT / 2 + 1, 0), // Slightly higher for the big star
        chaosPos: randomInSphere(12),
    }));
    const pos = useRef(new THREE.Vector3());

    // Generate 5-Pointed Star Shape
    const { starShape, extrudeSettings } = useMemo(() => {
        const shape = new THREE.Shape();
        const points = 5;
        const outerRadius = 2.2; // BIG Star
        const innerRadius = 0.9;

        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            // i=0 is outer radius. We want the top point to be at 12 o'clock.
            // standard trig: x=cos, y=sin starts at 3 o'clock.
            // x=sin, y=cos starts at 12 o'clock (Top).
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const x = Math.sin(angle) * r;
            const y = Math.cos(angle) * r;

            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();

        const settings = {
            depth: 0.5,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelSegments: 4
        };
        return { starShape: shape, extrudeSettings: settings };
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;
        const time = state.clock.elapsedTime;
        
        // Lerp position
        pos.current.lerpVectors(targets.targetPos, targets.chaosPos, chaos);
        groupRef.current.position.copy(pos.current);

        // Core Star Animation (Spinning)
        if (coreRef.current) {
            // Spin on Y axis (vertical)
            coreRef.current.rotation.y = time * 0.8;
            
            // Pulsing scale
            const scale = 1 + Math.sin(time * 3) * 0.05;
            coreRef.current.scale.setScalar(scale);
        }

        // Halo Animation (Breathing)
        if (haloRef.current) {
            const scale = 2.5 + Math.sin(time * 2) * 0.2;
            haloRef.current.scale.setScalar(scale);
            haloRef.current.rotation.z = -time * 0.2;
        }

        // Gentle floating of the whole star group
        groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
    });

    return (
        <group ref={groupRef}>
            {/* 1. The Super Bright 5-Pointed Star */}
            <Center>
                <mesh ref={coreRef}>
                    <extrudeGeometry args={[starShape, extrudeSettings]} />
                    <meshStandardMaterial 
                        color="#FFD700"
                        emissive="#FFD700"
                        emissiveIntensity={4} // Very bright for Bloom
                        metalness={1.0}
                        roughness={0.0}
                        toneMapped={false}
                    />
                </mesh>
            </Center>
            
            {/* 2. The Glow/Halo Sphere */}
            <mesh ref={haloRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial 
                    color="#FFD700"
                    transparent
                    opacity={0.2}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Light Source */}
            <pointLight 
                intensity={chaos > 0.5 ? 0.5 : 3.0} 
                distance={30} 
                color="#FFD700"
                decay={2}
            />
            
            {/* Additional sparkles/rays for that "Extra" look */}
            <group rotation={[0, 0, Math.PI / 4]}>
                 <mesh>
                     <boxGeometry args={[0.1, 8, 0.1]} />
                     <meshBasicMaterial color="#FFFFFF" transparent opacity={0.5} toneMapped={false} />
                 </mesh>
                 <mesh rotation={[0, 0, Math.PI / 2]}>
                     <boxGeometry args={[0.1, 8, 0.1]} />
                     <meshBasicMaterial color="#FFFFFF" transparent opacity={0.5} toneMapped={false} />
                 </mesh>
            </group>
        </group>
    );
}


// --- Sub-component for Ornaments ---
const OrnamentInstances = ({ data, currentChaos, photos }: { data: any[], currentChaos: number, photos: any[] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={groupRef}>
      {data.map((item, i) => (
        <Ornament 
          key={i} 
          item={item} 
          chaos={currentChaos} 
        />
      ))}
      
      {photos.map((photo, i) => (
        <PhotoOrnament 
            key={photo.id}
            photo={photo}
            chaos={currentChaos}
            index={i}
        />
      ))}
    </group>
  );
};

const Ornament: React.FC<{ item: any, chaos: number }> = ({ item, chaos }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [pos] = useState(() => new THREE.Vector3());
  
  useFrame(() => {
    if (!meshRef.current) return;
    // Lerp Position
    pos.lerpVectors(item.targetPos, item.chaosPos, chaos);
    meshRef.current.position.copy(pos);
    
    // Rotate slightly
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={meshRef} scale={item.scale} rotation={item.rotation}>
        {item.type === 'gift' ? <boxGeometry /> : <sphereGeometry args={[1, 16, 16]} />}
        <meshStandardMaterial 
            color={item.color} 
            metalness={0.9} 
            roughness={0.1}
            emissive={item.type === 'light' ? item.color : '#000000'}
            emissiveIntensity={item.type === 'light' ? 2 : 0}
        />
    </mesh>
  );
};

const PhotoOrnament: React.FC<{ photo: any, chaos: number, index: number }> = ({ photo, chaos, index }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useTexture(photo.url) as THREE.Texture;
    const [targets] = useState(() => {
        // Calculate a spot on the tree
        const t = randomOnCone(TREE_HEIGHT, TREE_RADIUS + 1.5);
        const c = randomInSphere(18);
        return { t, c };
    });
    
    const [pos] = useState(() => new THREE.Vector3());

    useFrame((state) => {
        if(!meshRef.current) return;
        
        // Lerp
        pos.lerpVectors(targets.t, targets.c, chaos);
        
        // Add floating motion
        const float = Math.sin(state.clock.elapsedTime + index) * 0.5;
        
        meshRef.current.position.set(pos.x, pos.y + float, pos.z);
        
        // Look at center (0,0,0) roughly, but when chaotic, spin wild
        if (chaos > 0.5) {
             meshRef.current.rotation.y += 0.02;
             meshRef.current.rotation.z += 0.01;
        } else {
             meshRef.current.lookAt(0, pos.y, 0);
             // Flip to face outward
             meshRef.current.rotation.y += Math.PI;
        }
    });

    return (
        <mesh ref={meshRef} scale={[2, 2 * (1/photo.aspectRatio), 1]}>
             <planeGeometry />
             <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
             {/* Polaroid Frame Border */}
             <mesh position={[0, 0, -0.01]} scale={[1.1, 1.1, 1]}>
                <planeGeometry />
                <meshBasicMaterial color="white" />
             </mesh>
        </mesh>
    );
};