'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface BuildingData {
  id: number;
  wardId: number;
  wardName: string;
  height: number;
  gridX: number;
  gridZ: number;
  healthScore: number;
  openComplaints: number;
  hasActiveComplaint: boolean;
  maxPriority: number; // 0-100
  marker?: THREE.Mesh;
  baseY?: number;
  blinkingSphere?: THREE.Mesh;
}

interface CitySceneProps {
  wards: any[];
  complaints: any[];
  city: string;
}

// Custom seedable random function to ensure consistent skylines per city
const createRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

export const CityScene: React.FC<CitySceneProps> = ({ wards, complaints, city }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverCardRef = useRef<HTMLDivElement>(null);
  
  const [hoverData, setHoverData] = useState<{
    wardName: string;
    openComplaints: number;
    healthScore: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any residual children to avoid multi-canvas glitches
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    
    // Background and Fog colors (Requested: cloudy blue sky in morning/light theme)
    let theme = document.documentElement.getAttribute('data-theme') || 'light';
    let bgColor = theme === 'dark' ? 0x080808 : 0xa0ccff; // Soft sky blue in Light Mode
    
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.010); // Slightly less dense fog to show clouds/stars

    // Camera: Isometric perspective
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(75, 80, 75);

    // Renderer (Optimized for ultra-smooth FPS and low GPU overhead)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 30;
    controls.maxDistance = 160;

    // Lighting
    const ambientLight = new THREE.AmbientLight(theme === 'dark' ? 0x222222 : 0x777777);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, theme === 'dark' ? 0.7 : 1.1);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // --- PROCEDURAL GENERATION: CITY GRID (~200 Buildings, Seeded by City) ---
    const rand = createRandom(city || 'Lucknow');

    const isLucknow = city.toLowerCase() === 'lucknow';
    const isDelhi = city.toLowerCase() === 'delhi';
    const isMumbai = city.toLowerCase() === 'mumbai';
    const isBengaluru = city.toLowerCase() === 'bengaluru';

    // --- CELESTIAL BODIES: Sun in Light Mode, Moon in Dark Mode ---
    // The Sun: Bright yellow/white sphere with glowing corona
    const sunGeo = new THREE.SphereGeometry(4.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff2a8 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(65, 75, -50);

    const sunCoronaGeo = new THREE.SphereGeometry(6.5, 16, 16);
    const sunCoronaMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.25 });
    const sunCorona = new THREE.Mesh(sunCoronaGeo, sunCoronaMat);
    sun.add(sunCorona);
    
    // The Moon: Soft glowing silver sphere (Requested: make moon smaller)
    const moonGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e8f0 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-65, 70, -50);

    const moonCoronaGeo = new THREE.SphereGeometry(2.3, 16, 16);
    const moonCoronaMat = new THREE.MeshBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.25 });
    const moonCorona = new THREE.Mesh(moonCoronaGeo, moonCoronaMat);
    moon.add(moonCorona);

    // Static Crater Coordinates for moon realism (sized down for smaller moon)
    const craterGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const craterMat = new THREE.MeshBasicMaterial({ color: 0xb5c4d2 });
    const craterOffsets = [
      { phi: 0.6, theta: 0.8 },
      { phi: 1.4, theta: 2.3 },
      { phi: 2.1, theta: 1.2 },
      { phi: 1.7, theta: 2.9 }
    ];
    craterOffsets.forEach(offset => {
      const crater = new THREE.Mesh(craterGeo, craterMat);
      crater.position.setFromSphericalCoords(1.5, offset.phi, offset.theta);
      moon.add(crater);
    });

    // Toggle celestial rendering and light position alignment
    if (theme === 'dark') {
      scene.add(moon);
      dirLight.position.set(-65, 70, -50);
    } else {
      scene.add(sun);
      dirLight.position.set(65, 75, -50);
    }

    // --- GLOWING STARS FIELD (Requested: fill night sky with glowing stars) ---
    const starsCount = 180;
    const starsGeo = new THREE.BufferGeometry();
    const starsPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      starsPos[i * 3] = (rand() - 0.5) * 220; // X position
      starsPos[i * 3 + 1] = 45 + rand() * 45;   // Y position (High in the sky)
      starsPos[i * 3 + 2] = (rand() - 0.5) * 220; // Z position
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    const starsField = new THREE.Points(starsGeo, starsMat);
    if (theme === 'dark') {
      scene.add(starsField);
    }

    // --- DYNAMIC CLOUDS GROUP (Requested: morning cloudy blue sky) ---
    const cloudsGroup = new THREE.Group();
    const cloudSphereGeo = new THREE.SphereGeometry(1.0, 12, 12);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });

    const createCloud = (x: number, y: number, z: number) => {
      const cloud = new THREE.Group();
      cloud.position.set(x, y, z);
      const sphereCount = 4 + Math.floor(rand() * 4);
      for (let i = 0; i < sphereCount; i++) {
        const sRadius = 2.0 + rand() * 2.5;
        const sMesh = new THREE.Mesh(cloudSphereGeo, cloudMat);
        sMesh.scale.set(sRadius, sRadius, sRadius);
        
        const offX = (rand() - 0.5) * 4.5;
        const offY = (rand() - 0.5) * 1.5;
        const offZ = (rand() - 0.5) * 4.5;
        sMesh.position.set(offX, offY, offZ);
        cloud.add(sMesh);
      }
      return cloud;
    };

    const clouds: THREE.Group[] = [];
    const cloudPositions = [
      { x: -50, y: 55, z: -35 },
      { x: -20, y: 58, z: 35 },
      { x: 30, y: 52, z: -40 },
      { x: 50, y: 60, z: 20 },
      { x: 10, y: 56, z: -15 },
      { x: -35, y: 54, z: 15 }
    ];
    cloudPositions.forEach(pos => {
      const cloud = createCloud(pos.x, pos.y, pos.z);
      cloudsGroup.add(cloud);
      clouds.push(cloud);
    });
    if (theme !== 'dark') {
      scene.add(cloudsGroup);
    }

    // Grid sizing and configs
    const gridCols = 15;
    const gridRows = 15;
    const spacing = isDelhi ? 8.2 : isMumbai ? 5.8 : 6.5; // Wider streets in Delhi, compact in Mumbai
    const buildings: THREE.Mesh[] = [];

    // --- MUMBAI COASTAL OCEAN BLOCK ---
    let waterGeo: THREE.PlaneGeometry | undefined = undefined;
    let waterMat: THREE.MeshBasicMaterial | undefined = undefined;
    if (isMumbai) {
      waterGeo = new THREE.PlaneGeometry(3 * spacing * 1.5, gridRows * spacing + 20);
      waterMat = new THREE.MeshBasicMaterial({ color: 0x0055aa, transparent: true, opacity: 0.7 });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set((-gridCols / 2 + 1) * spacing, 0.1, 0);
      scene.add(water);
    }

    // --- DELHI GREEN PARKS ---
    const treesGroup = new THREE.Group();
    const treeGeo = new THREE.ConeGeometry(0.7, 3.0, 4);
    const treeMat = new THREE.MeshBasicMaterial({ color: theme === 'dark' ? 0x0f401f : 0x228b22 });

    // Map complaints to wards
    const complaintsByWard: Record<number, any[]> = {};
    complaints.forEach(c => {
      const wId = c.ward_id || 1;
      if (!complaintsByWard[wId]) complaintsByWard[wId] = [];
      complaintsByWard[wId].push(c);
    });

    // Create materials
    const materials = {
      buildingLight: new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.3, metalness: 0.1 }),
      buildingDark: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.4, metalness: 0.2 }),
      road: new THREE.MeshStandardMaterial({ color: theme === 'dark' ? 0x0c0c0c : 0xf9f9f9, roughness: 0.8 }),
      complaintCritical: new THREE.MeshBasicMaterial({ color: 0xd03b3b }),
      complaintHigh: new THREE.MeshBasicMaterial({ color: 0xe05555 }),
      complaintLow: new THREE.MeshBasicMaterial({ color: 0x666666 }),
      // Colorful window glow options
      windowLitYellow: new THREE.MeshBasicMaterial({ color: 0xffdd55 }),
      windowLitAmber: new THREE.MeshBasicMaterial({ color: 0xffaa44 }),
      windowLitCyan: new THREE.MeshBasicMaterial({ color: 0x55eaff })
    };

    // Ground floor plane
    const groundGeo = new THREE.PlaneGeometry(gridCols * spacing + 20, gridRows * spacing + 20);
    const ground = new THREE.Mesh(groundGeo, materials.road);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Dynamic grid helper
    const gridHelper = new THREE.GridHelper(gridCols * spacing + 20, gridCols, theme === 'dark' ? 0x222222 : 0xdddddd, theme === 'dark' ? 0x121212 : 0xf2f2f2);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    const trackGeometry = <T extends THREE.BufferGeometry>(g: T): T => {
      geometriesToDispose.push(g);
      return g;
    };
    const trackMaterial = <T extends THREE.Material>(m: T): T => {
      materialsToDispose.push(m);
      return m;
    };

    // Shared geometries to optimize memory
    const windowGeo = trackGeometry(new THREE.BoxGeometry(0.42, 0.42, 0.06));
    const winSideGeo = trackGeometry(new THREE.BoxGeometry(0.06, 0.42, 0.42));
    const markerGeo = trackGeometry(new THREE.SphereGeometry(0.85, 16, 16));
    const bulbGeo = trackGeometry(new THREE.SphereGeometry(0.22, 8, 8));
    const tinyTreeGeo = trackGeometry(new THREE.ConeGeometry(0.3, 1.2, 4));

    let buildingId = 0;
    for (let x = 0; x < gridCols; x++) {
      for (let z = 0; z < gridRows; z++) {
        
        // --- City Specific Layout Rules ---
        if (isDelhi) {
          // Delhi wide layout: skip more cells to create parks/plazas
          if (x % 3 === 0 || z % 3 === 0) {
            // Plant a tree in skipped spots
            if (rand() < 0.22) {
              const treeHeightScale = 0.7 + rand() * 0.6;
              const tree = new THREE.Mesh(treeGeo, treeMat);
              tree.scale.set(1, treeHeightScale, 1);
              tree.position.set((x - gridCols / 2) * spacing, 1.5 * treeHeightScale, (z - gridRows / 2) * spacing);
              treesGroup.add(tree);
            }
            continue;
          }
        } else if (isMumbai) {
          // Mumbai coast skips (ocean on left edge)
          if (x < 3) continue;
          if (x % 5 === 0 && z % 5 === 0) continue;
        } else {
          // Lucknow / Bengaluru defaults
          if (x % 4 === 0 || z % 4 === 0) continue;
        }

        buildingId++;
        const xPos = (x - gridCols / 2) * spacing;
        const zPos = (z - gridRows / 2) * spacing;

        const activeWards = wards.length > 0 ? wards : [{ id: 1, name: 'Ward 1', health_score: 80 }];
        const wardObj = activeWards[buildingId % activeWards.length];
        const wardId = wardObj.id;
        
        const wardComplaints = complaintsByWard[wardId] || [];
        const activeComplaints = wardComplaints.filter(c => c.status !== 'resolved');
        const maxPriority = activeComplaints.length > 0 ? Math.max(...activeComplaints.map(c => c.priority_score)) : 0;
        
        const hasActiveComplaint = activeComplaints.length > 0 && (buildingId % 4 === 0);

        // --- CITY SPECIFIC HEIGHTS & DIMENSIONS ---
        let heightMultiplier = hasActiveComplaint ? 1.5 : 1.0;
        let bHeight = (rand() * 16 + 4) * heightMultiplier;
        let width = rand() * 1.5 + 2.8;
        let depth = rand() * 1.5 + 2.8;

        if (isMumbai) {
          // Tall slender skyscrapers in Mumbai
          bHeight = (rand() * 28 + 8) * heightMultiplier;
          width = rand() * 0.8 + 2.2;
          depth = rand() * 0.8 + 2.2;
        } else if (isLucknow) {
          // Lucknow heritage medium-low buildings
          bHeight = (rand() * 10 + 4) * heightMultiplier;
        } else if (isDelhi) {
          // Delhi wide grand blocks
          bHeight = (rand() * 7 + 5) * heightMultiplier;
          width = rand() * 2.0 + 3.6;
          depth = rand() * 2.0 + 3.6;
        } else if (isBengaluru) {
          // Bengaluru tech parks
          bHeight = (rand() * 22 + 6) * heightMultiplier;
        }

        let geo: THREE.BufferGeometry;
        let buildingType = 'generic';

        // Choose building style depending on the city
        if (isLucknow) {
          const ltype = rand();
          if (ltype < 0.5) {
            // Octagonal tower representation
            geo = trackGeometry(new THREE.CylinderGeometry(width * 0.5, width * 0.5, bHeight, 8));
            buildingType = 'lucknow-oct';
          } else {
            // Stepped building block
            geo = trackGeometry(new THREE.BoxGeometry(width, bHeight, depth));
            buildingType = 'lucknow-stepped';
          }
        } else if (isMumbai) {
          const mtype = rand();
          if (mtype < 0.33) {
            // Left part of twin tower with bridge
            geo = trackGeometry(new THREE.BoxGeometry(width * 0.45, bHeight, depth));
            buildingType = 'mumbai-twin';
          } else if (mtype < 0.66) {
            // Cylindrical tower with slanted top
            geo = trackGeometry(new THREE.CylinderGeometry(width * 0.5, width * 0.5, bHeight, 16));
            buildingType = 'mumbai-cyl';
          } else {
            // Standard height, we will add a podium at the bottom
            geo = trackGeometry(new THREE.BoxGeometry(width, bHeight * 0.8, depth));
            buildingType = 'mumbai-podium';
          }
        } else if (isDelhi) {
          const dtype = rand();
          if (dtype < 0.5) {
            // Circular colonnade building
            geo = trackGeometry(new THREE.CylinderGeometry(width * 0.8, width * 0.8, bHeight, 24));
            buildingType = 'delhi-circular';
          } else {
            // Grand wide blocks with portico columns
            geo = trackGeometry(new THREE.BoxGeometry(width, bHeight, depth));
            buildingType = 'delhi-block';
          }
        } else if (isBengaluru) {
          const btype = rand();
          if (btype < 0.5) {
            // Rotated tech building block (bottom half)
            geo = trackGeometry(new THREE.BoxGeometry(width, bHeight * 0.5, depth));
            buildingType = 'bengaluru-rotated';
          } else {
            // High-tech diagrid-frame tower
            geo = trackGeometry(new THREE.BoxGeometry(width, bHeight, depth));
            buildingType = 'bengaluru-diagrid';
          }
        } else {
          // Fallback / other cities
          geo = trackGeometry(new THREE.BoxGeometry(width, bHeight, depth));
          buildingType = 'generic';
        }

        const mat = theme === 'dark' ? materials.buildingDark.clone() : materials.buildingLight.clone();
        trackMaterial(mat);

        // Customize material colors based on city style
        if (isLucknow) {
          const lucknowColors = [0xdfc39a, 0xd27d53, 0xf4f1ea, 0xe8d0bb];
          const selectedColor = lucknowColors[Math.floor(rand() * lucknowColors.length)];
          if (theme === 'dark') {
            const hue = selectedColor === 0xd27d53 ? 0x2e190f : selectedColor === 0xdfc39a ? 0x2d251d : 0x1d1d1d;
            mat.color.setHex(hue);
          } else {
            mat.color.setHex(selectedColor);
          }
        } else if (isDelhi) {
          const delhiColors = [0x9e4b47, 0xf6f0e5, 0xb06c68, 0xebdcc3];
          const selectedColor = delhiColors[Math.floor(rand() * delhiColors.length)];
          if (theme === 'dark') {
            const hue = (selectedColor === 0x9e4b47 || selectedColor === 0xb06c68) ? 0x2d1a19 : 0x1a1a1a;
            mat.color.setHex(hue);
          } else {
            mat.color.setHex(selectedColor);
          }
        } else if (isMumbai) {
          const mumbaiColors = [0x0f2b46, 0x2c3e50, 0x7f8c8d, 0x34495e];
          const selectedColor = mumbaiColors[Math.floor(rand() * mumbaiColors.length)];
          if (theme === 'dark') {
            mat.color.setHex(0x0e1c28);
          } else {
            mat.color.setHex(selectedColor);
          }
        } else if (isBengaluru) {
          if (theme === 'dark') {
            mat.color.setHex(0x11161b);
          } else {
            mat.color.setHex(0xe3e9ed);
          }
        }

        const mesh = new THREE.Mesh(geo, mat);
        
        // Start building at y=0 scale for growth animation
        mesh.position.set(xPos, 0.001, zPos);
        mesh.scale.set(1, 0.001, 1);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Edge Blueprint Outlines
        const edges = trackGeometry(new THREE.EdgesGeometry(geo));
        
        let outlineColor = theme === 'dark' ? 0x00ffcc : 0xcccccc;
        if (isLucknow) outlineColor = theme === 'dark' ? 0xffaa44 : 0xaa7733; 
        else if (isDelhi) outlineColor = theme === 'dark' ? 0xff7766 : 0x995544; 
        else if (isMumbai) outlineColor = theme === 'dark' ? 0x55ccff : 0x4488aa; 
        else if (isBengaluru) outlineColor = theme === 'dark' ? 0x39ff14 : 0x00aa44; 

        const lineMat = trackMaterial(new THREE.LineBasicMaterial({ 
          color: outlineColor,
          transparent: true,
          opacity: theme === 'dark' ? 0.95 : 0.7
        }));
        const line = new THREE.LineSegments(edges, lineMat);
        mesh.add(line);

        // --- GLOWING WINDOWS IN DARK THEME ---
        if (theme === 'dark') {
          const windowCount = isBengaluru ? (Math.floor(rand() * 8) + 6) : (Math.floor(rand() * 5) + 3);
          const winMaterials = [materials.windowLitYellow, materials.windowLitAmber, materials.windowLitCyan];
          
          for (let w = 0; w < windowCount; w++) {
            const selectedWinMat = winMaterials[Math.floor(rand() * winMaterials.length)];
            const winMesh = new THREE.Mesh(windowGeo, selectedWinMat);
            
            const relY = (rand() - 0.5) * (bHeight - 2);
            const relX = (rand() - 0.5) * (width - 0.8);
            
            winMesh.position.set(relX, relY, depth / 2 + 0.02);
            mesh.add(winMesh);

            if (rand() > 0.5) {
              const winSide = new THREE.Mesh(winSideGeo, selectedWinMat);
              winSide.position.set(width / 2 + 0.02, relY, (rand() - 0.5) * (depth - 0.8));
              mesh.add(winSide);
            }
          }
        }

        // --- ADD CITY SPECIFIC CHILD STRUCTURES ---
        if (buildingType === 'lucknow-stepped') {
          const midGeo = trackGeometry(new THREE.BoxGeometry(width * 0.72, bHeight * 0.25, depth * 0.72));
          const midMat = mat.clone();
          trackMaterial(midMat);
          const midMesh = new THREE.Mesh(midGeo, midMat);
          midMesh.position.set(0, bHeight / 2 + (bHeight * 0.25) / 2, 0);
          midMesh.castShadow = true;
          midMesh.receiveShadow = true;
          mesh.add(midMesh);

          const midEdges = trackGeometry(new THREE.EdgesGeometry(midGeo));
          const midLine = new THREE.LineSegments(midEdges, lineMat);
          midMesh.add(midLine);

          const domeRadius = width * 0.25;
          const domeGeo = trackGeometry(new THREE.SphereGeometry(domeRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2));
          const domeMat = mat.clone();
          trackMaterial(domeMat);
          domeMat.color.setHex(theme === 'dark' ? 0x5a3e20 : 0xcc8844);
          const domeMesh = new THREE.Mesh(domeGeo, domeMat);
          domeMesh.position.set(0, (bHeight * 0.25) / 2 + domeRadius * 0.4, 0);
          domeMesh.castShadow = true;
          midMesh.add(domeMesh);

          const domeEdges = trackGeometry(new THREE.EdgesGeometry(domeGeo));
          const domeLineMat = trackMaterial(new THREE.LineBasicMaterial({
            color: theme === 'dark' ? 0xffbb55 : 0xaa7733,
            transparent: true,
            opacity: 0.8
          }));
          const domeLine = new THREE.LineSegments(domeEdges, domeLineMat);
          domeMesh.add(domeLine);

        } else if (buildingType === 'lucknow-oct') {
          const domeRadius = width * 0.48;
          const domeGeo = trackGeometry(new THREE.SphereGeometry(domeRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2));
          const domeMat = mat.clone();
          trackMaterial(domeMat);
          domeMat.color.setHex(theme === 'dark' ? 0x5a3e20 : 0xcc8844);
          const domeMesh = new THREE.Mesh(domeGeo, domeMat);
          domeMesh.scale.set(1, 1.3, 1);
          domeMesh.position.set(0, bHeight / 2 + domeRadius * 0.4, 0);
          domeMesh.castShadow = true;
          mesh.add(domeMesh);

          const domeEdges = trackGeometry(new THREE.EdgesGeometry(domeGeo));
          const domeLineMat = trackMaterial(new THREE.LineBasicMaterial({
            color: theme === 'dark' ? 0xffbb55 : 0xaa7733,
            transparent: true,
            opacity: 0.8
          }));
          const domeLine = new THREE.LineSegments(domeEdges, domeLineMat);
          domeMesh.add(domeLine);

        } else if (buildingType === 'mumbai-twin') {
          const rightGeo = trackGeometry(new THREE.BoxGeometry(width * 0.45, bHeight, depth));
          const rightMat = mat.clone();
          trackMaterial(rightMat);
          const rightMesh = new THREE.Mesh(rightGeo, rightMat);
          rightMesh.position.set(width * 0.85, 0, 0);
          rightMesh.castShadow = true;
          rightMesh.receiveShadow = true;
          mesh.add(rightMesh);

          const rightEdges = trackGeometry(new THREE.EdgesGeometry(rightGeo));
          const rightLine = new THREE.LineSegments(rightEdges, lineMat);
          rightMesh.add(rightLine);

          const bridgeGeo = trackGeometry(new THREE.BoxGeometry(width * 0.85, bHeight * 0.08, depth * 0.6));
          const bridgeMat = trackMaterial(new THREE.MeshStandardMaterial({ 
            color: theme === 'dark' ? 0x102535 : 0x88aacc, 
            metalness: 0.8, 
            roughness: 0.2 
          }));
          const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
          bridgeMesh.position.set(width * 0.425, bHeight * 0.25, 0);
          bridgeMesh.castShadow = true;
          mesh.add(bridgeMesh);

          const bridgeEdges = trackGeometry(new THREE.EdgesGeometry(bridgeGeo));
          const bridgeLine = new THREE.LineSegments(bridgeEdges, lineMat);
          bridgeMesh.add(bridgeLine);

        } else if (buildingType === 'mumbai-cyl') {
          const capGeo = trackGeometry(new THREE.CylinderGeometry(width * 0.5, width * 0.5, 0.4, 16));
          const capMat = trackMaterial(new THREE.MeshStandardMaterial({ 
            color: theme === 'dark' ? 0x00ffcc : 0x33bbaa,
            metalness: 0.9,
            roughness: 0.1
          }));
          const capMesh = new THREE.Mesh(capGeo, capMat);
          capMesh.position.set(0, bHeight / 2 + 0.1, 0);
          capMesh.rotation.x = 0.15;
          capMesh.castShadow = true;
          mesh.add(capMesh);

          const capEdges = trackGeometry(new THREE.EdgesGeometry(capGeo));
          const capLine = new THREE.LineSegments(capEdges, lineMat);
          capMesh.add(capLine);

        } else if (buildingType === 'mumbai-podium') {
          const podGeo = trackGeometry(new THREE.BoxGeometry(width * 1.5, bHeight * 0.25, depth * 1.5));
          const podMat = mat.clone();
          trackMaterial(podMat);
          if (theme === 'dark') {
            podMat.color.multiplyScalar(0.7);
          } else {
            podMat.color.addScalar(-0.06);
          }
          const podMesh = new THREE.Mesh(podGeo, podMat);
          podMesh.position.set(0, -bHeight * 0.4 + (bHeight * 0.25) / 2, 0);
          podMesh.castShadow = true;
          podMesh.receiveShadow = true;
          mesh.add(podMesh);

          const podEdges = trackGeometry(new THREE.EdgesGeometry(podGeo));
          const podLine = new THREE.LineSegments(podEdges, lineMat);
          podMesh.add(podLine);

        } else if (buildingType === 'delhi-circular') {
          const domeRadius = width * 0.4;
          const domeGeo = trackGeometry(new THREE.SphereGeometry(domeRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2));
          const domeMat = mat.clone();
          trackMaterial(domeMat);
          domeMat.color.setHex(theme === 'dark' ? 0x3d1a1a : 0xb56966);
          const domeMesh = new THREE.Mesh(domeGeo, domeMat);
          domeMesh.position.set(0, bHeight / 2, 0);
          domeMesh.castShadow = true;
          mesh.add(domeMesh);

          const domeEdges = trackGeometry(new THREE.EdgesGeometry(domeGeo));
          const domeLine = new THREE.LineSegments(domeEdges, lineMat);
          domeMesh.add(domeLine);

        } else if (buildingType === 'delhi-block') {
          const porticoGeo = trackGeometry(new THREE.BoxGeometry(width * 0.6, 0.4, depth * 0.3));
          const porticoMat = mat.clone();
          trackMaterial(porticoMat);
          const porticoMesh = new THREE.Mesh(porticoGeo, porticoMat);
          porticoMesh.position.set(0, -bHeight * 0.1, -depth / 2 - depth * 0.15);
          porticoMesh.castShadow = true;
          mesh.add(porticoMesh);

          const porticoEdges = trackGeometry(new THREE.EdgesGeometry(porticoGeo));
          const porticoLine = new THREE.LineSegments(porticoEdges, lineMat);
          porticoMesh.add(porticoLine);

          const colGeo = trackGeometry(new THREE.CylinderGeometry(0.12, 0.12, bHeight * 0.4, 8));
          const colMat = trackMaterial(new THREE.MeshStandardMaterial({ 
            color: theme === 'dark' ? 0x222222 : 0xf0f0f0,
            roughness: 0.6 
          }));
          
          const leftCol = new THREE.Mesh(colGeo, colMat);
          leftCol.position.set(-width * 0.22, -bHeight * 0.3, -depth / 2 - depth * 0.15);
          leftCol.castShadow = true;
          mesh.add(leftCol);

          const rightCol = new THREE.Mesh(colGeo, colMat);
          rightCol.position.set(width * 0.22, -bHeight * 0.3, -depth / 2 - depth * 0.15);
          rightCol.castShadow = true;
          mesh.add(rightCol);

        } else if (buildingType === 'bengaluru-rotated') {
          const topGeo = trackGeometry(new THREE.BoxGeometry(width * 0.82, bHeight * 0.5, depth * 0.82));
          const topMat = mat.clone();
          trackMaterial(topMat);
          if (theme === 'dark') {
            topMat.color.setHex(0x14202b);
          } else {
            topMat.color.setHex(0xcbe0f0);
          }
          const topMesh = new THREE.Mesh(topGeo, topMat);
          topMesh.position.set(0, bHeight * 0.5, 0);
          topMesh.rotation.y = Math.PI / 4;
          topMesh.castShadow = true;
          topMesh.receiveShadow = true;
          mesh.add(topMesh);

          const topEdges = trackGeometry(new THREE.EdgesGeometry(topGeo));
          const topLineMat = trackMaterial(new THREE.LineBasicMaterial({
            color: theme === 'dark' ? 0x00ffcc : 0x0088cc,
            transparent: true,
            opacity: 0.9
          }));
          const topLine = new THREE.LineSegments(topEdges, topLineMat);
          topMesh.add(topLine);

        } else if (buildingType === 'bengaluru-diagrid') {
          const bandGeo = trackGeometry(new THREE.BoxGeometry(width * 1.04, 0.3, depth * 1.04));
          const bandMat = trackMaterial(new THREE.MeshStandardMaterial({ 
            color: theme === 'dark' ? 0x00ff88 : 0x00aa66,
            metalness: 0.9, 
            roughness: 0.1 
          }));
          
          const band1 = new THREE.Mesh(bandGeo, bandMat);
          band1.position.set(0, -bHeight * 0.2, 0);
          band1.castShadow = true;
          mesh.add(band1);

          const band2 = new THREE.Mesh(bandGeo, bandMat);
          band2.position.set(0, bHeight * 0.2, 0);
          band2.castShadow = true;
          mesh.add(band2);
        }

        // Eco-tech rooftop gardens for Bengaluru
        if (isBengaluru && rand() < 0.4 && !hasActiveComplaint) {
          const roofGardenGeo = trackGeometry(new THREE.BoxGeometry(width * 0.8, 0.15, depth * 0.8));
          const roofGardenMat = trackMaterial(new THREE.MeshBasicMaterial({ color: 0x228b22 }));
          const roofGarden = new THREE.Mesh(roofGardenGeo, roofGardenMat);
          roofGarden.position.set(0, bHeight / 2 + 0.08, 0);
          mesh.add(roofGarden);

          const tinyTree = new THREE.Mesh(tinyTreeGeo, trackMaterial(new THREE.MeshBasicMaterial({ color: 0x1f5c25 })));
          tinyTree.position.set(0, 0.68, 0);
          roofGarden.add(tinyTree);
        }

        // Procedural Antennas & Towers
        let blinkingSphere: THREE.Mesh | undefined = undefined;
        const antennaChance = isBengaluru ? 0.35 : 0.18;
        const isHeritageLucknow = isLucknow && rand() < 0.5; // If it's a dome-topped tower, maybe no antenna
        if (rand() < antennaChance && !hasActiveComplaint && !isHeritageLucknow) {
          const antHeight = rand() * (isBengaluru ? 5.0 : 3.0) + (isBengaluru ? 4.0 : 3.0);
          const antennaGeo = trackGeometry(new THREE.CylinderGeometry(0.04, 0.06, antHeight, 8));
          const antennaMat = trackMaterial(new THREE.MeshStandardMaterial({ 
            color: theme === 'dark' ? 0x222222 : 0x999999,
            metalness: 0.8,
            roughness: 0.2
          }));
          const antenna = new THREE.Mesh(antennaGeo, antennaMat);
          antenna.position.set(0, bHeight / 2 + antHeight / 2, 0);
          mesh.add(antenna);

          const antEdges = trackGeometry(new THREE.EdgesGeometry(antennaGeo));
          const antLine = new THREE.LineSegments(antEdges, lineMat);
          antenna.add(antLine);

          blinkingSphere = new THREE.Mesh(bulbGeo, trackMaterial(new THREE.MeshBasicMaterial({ color: 0xd03b3b })));
          blinkingSphere.position.set(0, antHeight / 2 + 0.1, 0);
          antenna.add(blinkingSphere);
        }

        // Decorative roof deck (if generic/no special style)
        if (buildingType === 'generic' && rand() < 0.3 && !hasActiveComplaint) {
          const deckGeo = trackGeometry(new THREE.BoxGeometry(width * 0.7, 1.2, depth * 0.7));
          const deckMesh = new THREE.Mesh(deckGeo, mat);
          deckMesh.position.set(0, bHeight / 2 + 0.6, 0);
          mesh.add(deckMesh);
          
          const deckEdges = trackGeometry(new THREE.EdgesGeometry(deckGeo));
          const deckLine = new THREE.LineSegments(deckEdges, lineMat);
          deckMesh.add(deckLine);
        }

        buildings.push(mesh);

        const bData: BuildingData = {
          id: buildingId,
          wardId,
          wardName: wardObj.name,
          height: bHeight,
          gridX: xPos,
          gridZ: zPos,
          healthScore: wardObj.health_score || 73,
          openComplaints: activeComplaints.length,
          hasActiveComplaint,
          maxPriority,
          blinkingSphere
        };
        mesh.userData = bData;

        // Bouncing complaint marker
        if (hasActiveComplaint) {
          let sphereMat = materials.complaintLow;
          if (maxPriority >= 80) sphereMat = materials.complaintCritical;
          else if (maxPriority >= 60) sphereMat = materials.complaintHigh;

          const marker = new THREE.Mesh(markerGeo, sphereMat);
          marker.position.set(xPos, bHeight + 2, zPos);
          scene.add(marker);

          mesh.userData.marker = marker;
          mesh.userData.baseY = bHeight + 2.2;
        }
      }
    }

    // Add trees group if Delhi
    if (isDelhi) {
      scene.add(treesGroup);
    }

    // --- RAYCASTING & HOVER ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh: THREE.Mesh | null = null;
    let originalColor: THREE.Color | null = null;

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(buildings);

      if (intersects.length > 0) {
        const intersected = intersects[0].object as THREE.Mesh;
        
        if (hoveredMesh !== intersected) {
          if (hoveredMesh) {
            const m = hoveredMesh.material as THREE.MeshStandardMaterial;
            if (originalColor) m.color.copy(originalColor);
          }

          hoveredMesh = intersected;
          const m = hoveredMesh.material as THREE.MeshStandardMaterial;
          originalColor = m.color.clone();
          
          m.color.setHex(theme === 'dark' ? 0x2d2d2d : 0xc0c0c0);

          const data = intersected.userData as BuildingData;
          setHoverData({
            wardName: data.wardName,
            openComplaints: data.openComplaints,
            healthScore: data.healthScore
          });
        }

        if (hoverCardRef.current) {
          hoverCardRef.current.style.display = 'block';
          hoverCardRef.current.style.left = `${event.clientX + 15}px`;
          hoverCardRef.current.style.top = `${event.clientY + 15}px`;
        }
      } else {
        if (hoveredMesh) {
          const m = hoveredMesh.material as THREE.MeshStandardMaterial;
          if (originalColor) m.color.copy(originalColor);
          hoveredMesh = null;
        }
        setHoverData(null);
        if (hoverCardRef.current) {
          hoverCardRef.current.style.display = 'none';
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    // --- RESPOND TO THEME SWAPS ---
    const handleThemeChange = (e: any) => {
      theme = e.detail.theme;
      bgColor = theme === 'dark' ? 0x080808 : 0xa0ccff;

      if (scene.background instanceof THREE.Color) {
        scene.background.setHex(bgColor);
      }
      if (scene.fog && scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(bgColor);
      }
      ambientLight.color.setHex(theme === 'dark' ? 0x222222 : 0x777777);
      dirLight.intensity = theme === 'dark' ? 0.7 : 1.1;
      ground.material = materials.road;
      
      // Swap Celestial Bodies, Clouds, Stars, and Align Light source coordinates
      if (theme === 'dark') {
        scene.remove(sun);
        scene.add(moon);
        scene.remove(cloudsGroup);
        scene.add(starsField);
        dirLight.position.set(-65, 70, -50);
      } else {
        scene.remove(moon);
        scene.add(sun);
        scene.remove(starsField);
        scene.add(cloudsGroup);
        dirLight.position.set(65, 75, -50);
      }

      scene.remove(gridHelper);
      const newGrid = new THREE.GridHelper(gridCols * spacing + 20, gridCols, theme === 'dark' ? 0x222222 : 0xdddddd, theme === 'dark' ? 0x121212 : 0xf2f2f2);
      newGrid.position.y = 0.05;
      scene.add(newGrid);

      buildings.forEach(b => {
        const mat = b.material as THREE.MeshStandardMaterial;
        mat.color.setHex(theme === 'dark' ? 0x141414 : 0xeaeaea);
        
        b.children.forEach(c => {
          if (c instanceof THREE.Mesh) {
            const childMat = c.material;
            if (childMat && childMat instanceof THREE.MeshStandardMaterial) {
              childMat.color.setHex(theme === 'dark' ? 0x222222 : 0xeaeaea);
            }
          }
        });
      });
    };

    window.addEventListener('themechange', handleThemeChange);

    // --- ANIMATE RENDER LOOP (Handles smooth growth & rotation) ---
    let frameId: number;
    const timer = new THREE.Clock(); // Use Clock since we need simple elapsed time

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = timer.getElapsedTime();

      // Cinematic slow grid rotation
      scene.rotation.y = elapsed * 0.015;

      // Twinkle night stars
      if (theme === 'dark' && starsMat) {
        starsMat.opacity = 0.5 + 0.45 * Math.abs(Math.sin(elapsed * 2.2));
      }

      // Float clouds slowly
      if (theme !== 'dark') {
        clouds.forEach(c => {
          c.position.x += 0.012;
          if (c.position.x > 80) {
            c.position.x = -80;
          }
        });
      }

      // Animate active complaint markers & blinking red aviation spires & growth interpolation
      buildings.forEach(b => {
        const bD = b.userData as BuildingData;
        
        // Smooth building height growth
        if (b.scale.y < 1.0) {
          b.scale.y += (1.0 - b.scale.y) * 0.06 + 0.002;
          if (b.scale.y > 1.0) b.scale.y = 1.0;
          b.position.y = (bD.height * b.scale.y) / 2;
        }

        // Bouncing complaint marker
        if (bD.hasActiveComplaint && bD.marker) {
          bD.marker.position.y = (bD.height * b.scale.y) + 2.2 + Math.sin(elapsed * 4 + bD.id) * 0.3;
          const scale = 1.0 + Math.sin(elapsed * 3 + bD.id) * 0.08;
          bD.marker.scale.set(scale, scale, scale);
        }

        // Blinking red spires on roof peaks
        if (bD.blinkingSphere) {
          const intensity = 0.2 + Math.abs(Math.sin(elapsed * 5 + bD.id)) * 0.8;
          const mat = bD.blinkingSphere.material as THREE.MeshBasicMaterial;
          mat.color.setRGB(intensity, 0, 0);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('themechange', handleThemeChange);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      groundGeo.dispose();
      sunGeo.dispose();
      sunMat.dispose();
      sunCoronaGeo.dispose();
      sunCoronaMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      moonCoronaGeo.dispose();
      moonCoronaMat.dispose();
      craterGeo.dispose();
      craterMat.dispose();
      starsGeo.dispose();
      starsMat.dispose();
      cloudSphereGeo.dispose();
      cloudMat.dispose();
      if (waterGeo) waterGeo.dispose();
      if (waterMat) waterMat.dispose();
      treeGeo.dispose();
      treeMat.dispose();
      materials.buildingLight.dispose();
      materials.buildingDark.dispose();
      materials.road.dispose();
      materials.complaintCritical.dispose();
      materials.complaintHigh.dispose();
      materials.complaintLow.dispose();
      materials.windowLitYellow.dispose();
      materials.windowLitAmber.dispose();
      materials.windowLitCyan.dispose();
      geometriesToDispose.forEach(g => g.dispose());
      materialsToDispose.forEach(m => m.dispose());
      renderer.dispose();
    };
  }, [wards, complaints, city]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      <div
        ref={hoverCardRef}
        style={{
          position: 'fixed',
          display: 'none',
          pointerEvents: 'none',
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          padding: '12px 16px',
          zIndex: 1000,
          boxShadow: 'var(--glow-intensity)',
          transition: 'opacity 0.15s ease-out'
        }}
      >
        {hoverData && (
          <div>
            <div
              className="mono"
              style={{
                fontSize: '11px',
                color: 'var(--primary-text)',
                opacity: 0.5,
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}
            >
              CITY WARD METRICS
            </div>
            <h2
              className="h2"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--primary-text)',
                marginBottom: '8px',
                fontFamily: 'var(--font-display)'
              }}
            >
              {hoverData.wardName}
            </h2>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              }}
            >
              <div>
                <span style={{ opacity: 0.6 }}>Complaints:</span>{' '}
                <strong style={{ color: hoverData.openComplaints > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {hoverData.openComplaints}
                </strong>
              </div>
              <div>
                <span style={{ opacity: 0.6 }}>Health Score:</span>{' '}
                <strong style={{ color: hoverData.healthScore > 75 ? 'var(--success)' : 'var(--danger)' }}>
                  {hoverData.healthScore}%
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
