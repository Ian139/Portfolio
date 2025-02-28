'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PortfolioSection {
  position: number;  // Z position in space
  title: string;
  description: string;
  color: number;
  link?: string; // Optional link for each section
  content?: string; // Detailed content to show in panel
  xPosition?: number; // X position in space
  visited?: boolean; // Track if section has been visited
}

// Define rocket customization options
interface RocketCustomization {
  bodyColor: number;
  accentColor: number;
  windowColor: number;
}

const portfolioSections: PortfolioSection[] = [
  {
    position: -50,
    title: "Welcome!",
    description: "Press W to fly forward, S to reverse",
    color: 0x4a9eff,
    content: `# Welcome to My Portfolio!

Navigate through space using:
- W/S: Move forward/backward
- A/D: Move left/right
- Space: Boost
- F: Interact with platforms

Explore different sections to learn more about me and my work.`
  },
  {
    position: -150,
    title: "About Me",
    description: "Software Engineer & Creator",
    color: 0xff4a4a,
    content: `# About Me

I'm a passionate software engineer with a love for creating immersive digital experiences. My journey in technology has led me to work on various exciting projects, from web applications to 3D interactive experiences.

## Skills Overview
- Frontend Development
- 3D Graphics & Animation
- User Experience Design
- Creative Problem Solving`
  },
  {
    position: -250,
    title: "Projects",
    description: "Check out my work",
    color: 0x4aff4a,
    content: `# Featured Projects

## Interactive Portfolio
A 3D space-themed portfolio showcasing my work through an immersive experience.

## Project 2
Description of another significant project...

## Project 3
Details about a third project...

Each project demonstrates my commitment to creating engaging user experiences.`
  },
  {
    position: -350,
    title: "Skills",
    description: "Technologies I work with",
    color: 0xff4aff,
    content: `# Technical Skills

## Frontend
- React/Next.js
- Three.js/WebGL
- TypeScript
- CSS/Tailwind

## Backend
- Node.js
- Python
- Databases

## Other
- 3D Modeling
- UI/UX Design
- Version Control`
  }
];

// Assign random X positions to each section
portfolioSections.forEach(section => {
  // Random X position between -80 and 80
  section.xPosition = (Math.random() - 0.5) * 160;
});

const RocketScene = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rocketRef = useRef<THREE.Group | undefined>(undefined);
  const speedRef = useRef(0);
  const lateralSpeedRef = useRef(0); // For A/D movement
  const rollRef = useRef(0);
  const keysRef = useRef({ w: false, s: false, a: false, d: false, space: false, f: false });
  const sectionsRef = useRef<THREE.Group[]>([]);
  const [activeSection, setActiveSection] = useState<PortfolioSection | null>(null);
  const sunRef = useRef<THREE.Group | undefined>(undefined);
  const cycleTimeRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [showTablet, setShowTablet] = useState(false);
  const [onPlatform, setOnPlatform] = useState(false);
  const fJustPressedRef = useRef(false);
  const initialCameraPosition = useRef<{x: number, y: number, z: number} | null>(null);
  const [rocketPosition, setRocketPosition] = useState({ x: 0, y: 0, z: 0 });
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set());
  const [showFireworks, setShowFireworks] = useState(false);
  const fireworksTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // New states for our added features
  const [cameraMode, setCameraMode] = useState<'third-person' | 'first-person'>('third-person');
  const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
  const [rocketCustomization, setRocketCustomization] = useState<RocketCustomization>({
    bodyColor: 0x888888,
    accentColor: 0x777777,
    windowColor: 0x44aaff
  });
  const [asteroidCollision, setAsteroidCollision] = useState(false);
  const asteroidsRef = useRef<THREE.Group[]>([]);
  const collisionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle camera mode toggle
  const toggleCameraMode = () => {
    setCameraMode(prev => {
      const newMode = prev === 'third-person' ? 'first-person' : 'third-person';
      
      // Immediately adjust camera FOV based on mode
      if (rocketRef.current) {
        const camera = rocketRef.current.parent?.children.find(
          child => child instanceof THREE.PerspectiveCamera
        ) as THREE.PerspectiveCamera;
        
        if (camera) {
          // Wider FOV for first-person to give better cockpit feel
          camera.fov = newMode === 'first-person' ? 90 : 75;
          camera.updateProjectionMatrix();
        }
      }
      
      return newMode;
    });
  };

  // Function to reset rocket position and regenerate platform positions
  const resetRocket = () => {
    if (rocketRef.current && initialCameraPosition.current) {
      // Reset movement values
      speedRef.current = 0;
      lateralSpeedRef.current = 0;
      rollRef.current = 0;
      
      // Reset camera position to initial starting point
      const camera = rocketRef.current.parent?.children.find(
        child => child instanceof THREE.PerspectiveCamera
      ) as THREE.PerspectiveCamera;
      
      if (camera) {
        // Position the camera based on current camera mode
        if (cameraMode === 'third-person') {
          // Third-person camera reset
          camera.position.set(
            0, // Set camera X to 0 so rocket will be at X=0 
            8, // Keep Y the same
            20 // Set camera Z to 20 so rocket will be at Z=0
          );
          
          // The animation loop will position the rocket at (0, 0, 0) relative to the camera
          // but let's set it explicitly now to ensure immediate update
          rocketRef.current.position.set(0, 0, 0);
          
          // Make camera look at the rocket
          camera.lookAt(rocketRef.current.position);
        } else {
          // First-person camera reset
          // Position rocket at origin
          rocketRef.current.position.set(0, 0, 0);
          
          // Position camera in cockpit
          camera.position.set(
            0,
            rocketRef.current.position.y + 1.5, // Higher up for cockpit view
            0.5 // Slightly behind rocket front
          );
          
          // Look forward
          camera.lookAt(new THREE.Vector3(0, camera.position.y, -100));
        }
        
        rocketRef.current.rotation.set(0, 0, 0);
        
        // Reset the rocket's rotation
        const rocket = rocketRef.current.children[0] as THREE.Group;
        if (rocket) {
          rocket.rotation.x = -Math.PI / 2; // Original forward-facing orientation
          rocket.rotation.y = 0;
          rocket.rotation.z = 0;
          
          // Ensure rocket is visible with proper opacity in third-person mode
          if (cameraMode === 'third-person') {
            rocket.visible = true;
            
            // Restore upper section opacity
            const upperSection = rocket.children[0] as THREE.Mesh;
            if (upperSection && upperSection.material) {
              (upperSection.material as THREE.MeshPhongMaterial).opacity = 1.0;
              (upperSection.material as THREE.MeshPhongMaterial).transparent = false;
            }
          }
        }
        
        // Update position state immediately to reflect the reset
        setRocketPosition({
          x: 0,
          y: 0,
          z: 0
        });
      }
      
      // Regenerate random positions for platforms
      portfolioSections.forEach((section, index) => {
        // Generate new random X position between -80 and 80
        section.xPosition = (Math.random() - 0.5) * 160;
        
        // Update platform positions in the scene
        if (sectionsRef.current[index]) {
          sectionsRef.current[index].position.x = section.xPosition;
          
          // Reset Y position animation
          sectionsRef.current[index].userData.hoverOffset = 0;
          sectionsRef.current[index].position.y = sectionsRef.current[index].userData.originalY;
          
          // Reset text position
          const text = sectionsRef.current[index].children[1] as THREE.Mesh;
          text.position.y = sectionsRef.current[index].userData.originalTextY;
        }
      });
      
      // Reset state
      setActiveSection(null);
      setOnPlatform(false);
      setShowTablet(false);
      
      // Reset visited sections
      setVisitedSections(new Set());
      setShowFireworks(false);
      
      // Clear any pending fireworks timeout
      if (fireworksTimeoutRef.current) {
        clearTimeout(fireworksTimeoutRef.current);
        fireworksTimeoutRef.current = null;
      }
      
      // Reset asteroids when resetting the rocket
      if (asteroidsRef.current.length > 0) {
        asteroidsRef.current.forEach(asteroid => {
          // Generate new random positions
          asteroid.position.set(
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 200,
            camera.position.z - (Math.random() * 400 + 100)
          );
          // Reset rotation
          asteroid.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          );
        });
      }
      
      // Reset collision state
      setAsteroidCollision(false);
      if (collisionTimeoutRef.current) {
        clearTimeout(collisionTimeoutRef.current);
        collisionTimeoutRef.current = null;
      }
    }
  };

  // Function to handle visiting a section
  const handleSectionVisit = (sectionTitle: string) => {
    if (!visitedSections.has(sectionTitle)) {
      const newVisited = new Set(visitedSections);
      newVisited.add(sectionTitle);
      setVisitedSections(newVisited);
      
      // Check if all sections have been visited
      if (newVisited.size === portfolioSections.length) {
        setShowFireworks(true);
        
        // Clear previous timeout if exists
        if (fireworksTimeoutRef.current) {
          clearTimeout(fireworksTimeoutRef.current);
        }
        
        // Hide fireworks after 8 seconds (extended for better effect)
        fireworksTimeoutRef.current = setTimeout(() => {
          setShowFireworks(false);
        }, 8000);
      }
    }
  };

  // Function to get badge colors from visited sections
  const getBadgeColors = () => {
    const colors: string[] = [];
    
    // Convert section colors to hex strings
    portfolioSections.forEach(section => {
      if (visitedSections.has(section.title)) {
        colors.push(`#${section.color.toString(16).padStart(6, '0')}`);
      }
    });
    
    // Add placeholder colors if not enough visited sections
    while (colors.length < portfolioSections.length) {
      colors.push('#444444');
    }
    
    return colors;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Position camera above and to the right
    camera.position.set(10, 8, 20);
    initialCameraPosition.current = { 
      x: camera.position.x, 
      y: camera.position.y, 
      z: camera.position.z 
    };
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create low-poly rocket
    const rocket = new THREE.Group();
    rocket.position.set(0, 0, 0);
    
    // Upper section (octagonal)
    const upperGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 8, 1);
    const upperMaterial = new THREE.MeshPhongMaterial({ 
      color: rocketCustomization.bodyColor,
      flatShading: true 
    });
    const upperSection = new THREE.Mesh(upperGeometry, upperMaterial);
    upperSection.position.y = 1;
    rocket.add(upperSection);

    // Add windows to the upper section
    const windowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const windowMaterial = new THREE.MeshPhongMaterial({ 
      color: rocketCustomization.windowColor,
      emissive: 0x3388cc,
      emissiveIntensity: 0.3,
      flatShading: true 
    });
    
    // Create 3 windows around the upper section
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.set(
        Math.cos(angle) * 1.2,
        1, // Same height as upper section
        Math.sin(angle) * 1.2
      );
      rocket.add(windowMesh);
    }

    // Lower section (slightly larger octagonal)
    const lowerGeometry = new THREE.CylinderGeometry(1.4, 1.4, 1.5, 8, 1);
    const lowerMaterial = new THREE.MeshPhongMaterial({ 
      color: rocketCustomization.accentColor,
      flatShading: true 
    });
    const lowerSection = new THREE.Mesh(lowerGeometry, lowerMaterial);
    lowerSection.position.y = -0.5;
    rocket.add(lowerSection);

    // Create rocket effects group to hold all fire effects
    const rocketEffects = new THREE.Group();
    rocket.add(rocketEffects);

    // Create low-poly fire effect
    const fireGeometry = new THREE.ConeGeometry(0.7, 2, 8);
    const fireMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4400,
      flatShading: true,
      transparent: true,
      opacity: 0.8,
      emissive: 0xff2200,
      emissiveIntensity: 0.5
    });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.y = -2;
    fire.position.z = 0;
    fire.rotation.x = -Math.PI; // Point the fire backward
    rocketEffects.add(fire);
    
    // Add fire glow effect
    const fireGlowGeometry = new THREE.ConeGeometry(1.2, 2.5, 8);
    const fireGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const fireGlow = new THREE.Mesh(fireGlowGeometry, fireGlowMaterial);
    fireGlow.position.copy(fire.position);
    fireGlow.rotation.copy(fire.rotation);
    rocketEffects.add(fireGlow);
    
    // Create reverse fire (blue flame at the front)
    const reverseFireGeometry = new THREE.ConeGeometry(0.7, 2, 8);
    const reverseFireMaterial = new THREE.MeshPhongMaterial({
      color: 0x4466ff,
      flatShading: true,
      transparent: true,
      opacity: 0.8,
      emissive: 0x2244ff,
      emissiveIntensity: 0.5
    });
    const reverseFire = new THREE.Mesh(reverseFireGeometry, reverseFireMaterial);
    reverseFire.position.y = 2.5; // Position at front of rocket
    reverseFire.position.z = 0;
    reverseFire.rotation.x = 0; // Point the fire forward
    reverseFire.visible = false; // Initially hidden
    rocketEffects.add(reverseFire);
    
    // Add reverse fire glow effect
    const reverseFireGlowGeometry = new THREE.ConeGeometry(1.2, 2.5, 8);
    const reverseFireGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x66aaff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const reverseFireGlow = new THREE.Mesh(reverseFireGlowGeometry, reverseFireGlowMaterial);
    reverseFireGlow.position.copy(reverseFire.position);
    reverseFireGlow.rotation.copy(reverseFire.rotation);
    reverseFireGlow.visible = false; // Initially hidden
    rocketEffects.add(reverseFireGlow);

    // Create a container for the rocket that will handle the roll
    const rocketContainer = new THREE.Group();
    rocketContainer.add(rocket);
    scene.add(rocketContainer);
    
    // Rotate rocket to face forward (pitch)
    rocket.rotation.x = -Math.PI / 2;
    
    rocketRef.current = rocketContainer;

    // Add stars (particles)
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 5000; // Increased star count for better density
    const starsPositions = new Float32Array(starCount * 3);
    const starSpread = 400; // Increased spread for better distribution

    for (let i = 0; i < starCount * 3; i += 3) {
      starsPositions[i] = (Math.random() - 0.5) * starSpread;     // x
      starsPositions[i + 1] = (Math.random() - 0.5) * starSpread; // y
      starsPositions[i + 2] = (Math.random() - 0.5) * starSpread; // z
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xFFFFFF, 
      size: 0.3,  // Slightly increased star size
      sizeAttenuation: true
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x555555, 0.5); // Darker ambient for night
    scene.add(ambientLight);

    // Create sun
    const sunGroup = new THREE.Group();
    const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.8
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sunMesh);

    // Add glow effect to sun
    const sunGlowGeometry = new THREE.SphereGeometry(18, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.2
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGroup.add(sunGlow);

    // Position sun in the distance
    sunGroup.position.set(0, 0, -200);
    scene.add(sunGroup);
    sunRef.current = sunGroup;

    // Main directional light (sun light)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.copy(sunGroup.position);
    scene.add(sunLight);

    // Create asteroids field
    const asteroidGroup = new THREE.Group();
    scene.add(asteroidGroup);
    
    // Create 50 asteroids
    for (let i = 0; i < 50; i++) {
      // Create a random asteroid shape using icosahedron with random vertices
      const asteroidGeometry = new THREE.IcosahedronGeometry(
        Math.random() * 3 + 1, // Random size between 1-4
        0 // Detail level
      );
      
      // Modify vertices to make it look more like an asteroid
      const vertices = asteroidGeometry.attributes.position;
      for (let j = 0; j < vertices.count; j++) {
        const x = vertices.getX(j);
        const y = vertices.getY(j);
        const z = vertices.getZ(j);
        
        // Add random displacement to each vertex
        vertices.setX(j, x + (Math.random() - 0.5) * 0.5);
        vertices.setY(j, y + (Math.random() - 0.5) * 0.5);
        vertices.setZ(j, z + (Math.random() - 0.5) * 0.5);
      }
      
      // Create a material with random colors in the gray-brown range
      const hue = Math.random() * 0.1 + 0.05; // 0.05-0.15 range (brownish)
      const saturation = Math.random() * 0.3 + 0.1; // 0.1-0.4 range
      const lightness = Math.random() * 0.2 + 0.2; // 0.2-0.4 range (darker)
      
      const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, saturation, lightness),
        flatShading: true,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      
      // Position asteroids randomly in space with more in front of the rocket
      asteroid.position.set(
        (Math.random() - 0.5) * 300, // X: Spread horizontally
        (Math.random() - 0.5) * 200, // Y: Spread vertically
        camera.position.z - (Math.random() * 400 + 100) // Z: Positioned ahead of the rocket
      );
      
      // Random rotation
      asteroid.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      // Add to scene and store reference
      asteroidGroup.add(asteroid);
      asteroidsRef.current.push(asteroid as unknown as THREE.Group);
    }
    
    // Also add a planetary ring system
    const ringGroup = new THREE.Group();
    
    // Create the main ring
    const ringGeometry = new THREE.RingGeometry(30, 60, 64);
    
    // Modify UVs to enable texture repetition along the ring
    const ringUvs = ringGeometry.attributes.uv;
    for (let i = 0; i < ringUvs.count; i++) {
      const u = ringUvs.getX(i);
      
      // Map u from 0-1 to 0-2π for proper wrapping
      ringUvs.setX(i, u * 2 * Math.PI);
    }
    
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xddbb88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      roughness: 0.8
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2; // Make it horizontal
    ring.position.set(60, -20, -180); // Position it in the distance
    
    ringGroup.add(ring);
    scene.add(ringGroup);

    // Update keyboard handler
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'w') keysRef.current.w = true;
      if (event.key === 's') keysRef.current.s = true;
      if (event.key === 'a') keysRef.current.a = true;
      if (event.key === 'd') keysRef.current.d = true;
      if (event.key === ' ') {
        event.preventDefault(); // Prevent space from triggering click
        keysRef.current.space = true;
      }
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault(); // Prevent default
        console.log('F key pressed in ThreeJS context');
        if (!keysRef.current.f) {
          fJustPressedRef.current = true;
        }
        keysRef.current.f = true;
        
        // Directly try to show tablet if on platform
        if (onPlatform && activeSection) {
          console.log('Attempting to show tablet from keydown');
          setShowTablet(true);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'w') keysRef.current.w = false;
      if (event.key === 's') keysRef.current.s = false;
      if (event.key === 'a') keysRef.current.a = false;
      if (event.key === 'd') keysRef.current.d = false;
      if (event.key === ' ') keysRef.current.space = false;
      if (event.key === 'f' || event.key === 'F') keysRef.current.f = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Create portfolio sections
    portfolioSections.forEach((section) => {
      const sectionGroup = new THREE.Group();
      
      // Create floating platform
      const platformGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 8);
      const platformMaterial = new THREE.MeshPhongMaterial({
        color: section.color,
        flatShading: true,
        transparent: true,
        opacity: 0.8
      });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      sectionGroup.add(platform);

      // Create floating text (represented as a placeholder mesh for now)
      const textGeometry = new THREE.BoxGeometry(8, 1.5, 0.1);
      const textMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.y = 2;
      sectionGroup.add(textMesh);

      // Position the section in space - now with X position
      sectionGroup.position.set(section.xPosition || 0, -2, section.position);
      
      // Add hover animation and initial properties
      sectionGroup.userData = {
        originalY: sectionGroup.position.y,
        originalTextY: 2, // Store original text Y position
        hoverOffset: 0,
        speed: 0.001 + Math.random() * 0.002,
        textTargetY: 2 // Add targetY for text transitions
      };

      scene.add(sectionGroup);
      sectionsRef.current.push(sectionGroup);
    });

    // Animation loop
    const animate = () => {
      // Update sun position for day/night cycle (now 120 second cycle instead of 30)
      cycleTimeRef.current = (cycleTimeRef.current + 0.25) % (120 * 60); // 120 seconds at 60fps (with slower increment)
      const cycleProgress = cycleTimeRef.current / (120 * 60);
      const sunAngle = cycleProgress * Math.PI * 2;

      if (sunRef.current) {
        // Orbit sun around the scene
        const orbitRadius = 200;
        sunRef.current.position.y = Math.sin(sunAngle) * orbitRadius;
        sunRef.current.position.z = Math.cos(sunAngle) * orbitRadius;

        // Update sun light position
        const sunLight = scene.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
        if (sunLight) {
          sunLight.position.copy(sunRef.current.position);
          
          // Adjust light intensity based on sun position
          const intensity = Math.max(0.1, Math.sin(sunAngle));
          sunLight.intensity = intensity;
          
          // Adjust ambient light for day/night cycle
          const ambientLight = scene.children.find(child => child instanceof THREE.AmbientLight) as THREE.AmbientLight;
          if (ambientLight) {
            ambientLight.intensity = 0.2 + intensity * 0.3;
          }

          // Adjust scene background color for day/night cycle
          const dayColor = new THREE.Color(0x4444ff);
          const nightColor = new THREE.Color(0x000000);
          scene.background = new THREE.Color().lerpColors(nightColor, dayColor, intensity * 0.7);
        }
      }

      // Handle boost
      const maxNormalSpeed = 0.5;
      const maxBoostSpeed = 1.5;
      const currentMaxSpeed = keysRef.current.space ? maxBoostSpeed : maxNormalSpeed;

      if (keysRef.current.w) {
        speedRef.current = Math.min(speedRef.current + 0.02, currentMaxSpeed);
      } else if (keysRef.current.s) {
        speedRef.current = Math.max(speedRef.current - 0.02, -currentMaxSpeed);
      } else {
        speedRef.current *= 0.98;
      }

      // Handle lateral movement with A and D - Fixed to be more intuitive
      const maxLateralSpeed = 0.3;
      if (keysRef.current.a) {
        lateralSpeedRef.current = Math.max(lateralSpeedRef.current - 0.01, -maxLateralSpeed);
      } else if (keysRef.current.d) {
        lateralSpeedRef.current = Math.min(lateralSpeedRef.current + 0.01, maxLateralSpeed);
      } else {
        lateralSpeedRef.current *= 0.95; // Gradually slow down
      }

      // Handle turning/banking - now makes the rocket actually turn
      const turnSpeed = 0.1;
      if (keysRef.current.a) {
        // Turn left 
        rollRef.current = Math.min(rollRef.current + turnSpeed, Math.PI * 0.3);
      } else if (keysRef.current.d) {
        // Turn right
        rollRef.current = Math.max(rollRef.current - turnSpeed, -Math.PI * 0.3);
      } else {
        rollRef.current *= 0.95; // Return to neutral position
      }

      if (rocketRef.current) {
        // Move camera and rocket in Z axis
        camera.position.z -= speedRef.current;
        
        // Move camera and rocket in X axis
        camera.position.x += lateralSpeedRef.current;
        
        // Handle camera mode positioning
        if (cameraMode === 'third-person') {
          // Third-person view
          rocketRef.current.position.z = camera.position.z - 20;
          rocketRef.current.position.x = camera.position.x;
          
          // Make rocket fully visible and restore opacity
          const rocket = rocketRef.current.children[0] as THREE.Group;
          if (rocket) {
            rocket.visible = true;
            
            // Restore upper section opacity
            const upperSection = rocket.children[0] as THREE.Mesh;
            if (upperSection && upperSection.material) {
              (upperSection.material as THREE.MeshPhongMaterial).opacity = 1.0;
              (upperSection.material as THREE.MeshPhongMaterial).transparent = false;
            }
          }
          
          // Set camera to look at the rocket
          camera.lookAt(rocketRef.current.position);
        } else {
          // First-person view
          
          // First update rocket position based on camera movement
          rocketRef.current.position.z = camera.position.z - 0.5; // Slightly in front of camera
          rocketRef.current.position.x = camera.position.x;
          
          // Then position camera at rocket position (in cockpit)
          camera.position.set(
            rocketRef.current.position.x,
            rocketRef.current.position.y + 1.5, // Higher up for better cockpit view
            rocketRef.current.position.z + 0.5  // Slightly behind rocket front
          );
          
          // Hide or make rocket body transparent in first-person
          const rocket = rocketRef.current.children[0] as THREE.Group;
          if (rocket) {
            // Option 1: Hide the rocket body completely
            // rocket.visible = false;
            
            // Option 2: Make upper section transparent but keep windows and effects
            const upperSection = rocket.children[0] as THREE.Mesh;
            if (upperSection && upperSection.material) {
              (upperSection.material as THREE.MeshPhongMaterial).opacity = 0.2;
              (upperSection.material as THREE.MeshPhongMaterial).transparent = true;
            }
          }
          
          // Look ahead of the rocket with more pronounced turning
          const lookTarget = new THREE.Vector3(
            camera.position.x + lateralSpeedRef.current * 20, // More pronounced turning
            camera.position.y, 
            camera.position.z - 100 // Look further ahead
          );
          camera.lookAt(lookTarget);
          
          // Add camera roll effect in first-person to simulate banking
          camera.rotation.z = -rollRef.current * 0.7; // Less intense than the rocket's roll
        }
        
        // Apply roll and slight turning to the rocket container
        rocketRef.current.rotation.z = -rollRef.current;
        
        // Add yaw (turn) based on lateral movement
        // When reversing (speed < 0), turn in the same direction as movement
        // When moving forward (speed >= 0), turn in the opposite direction
        if (speedRef.current < 0) {
          // When reversing: face right for D, left for A (same as movement direction)
          rocketRef.current.rotation.y = lateralSpeedRef.current * 0.5;
        } else {
          // When moving forward: face left for D, right for A (opposite to movement)
          rocketRef.current.rotation.y = -lateralSpeedRef.current * 0.5;
        }
        
        // Apply pitch based on speed to the rocket itself
        const targetRotation = -speedRef.current * 0.2;
        const rocket = rocketRef.current.children[0] as THREE.Group;
        if (rocket) {
          rocket.rotation.x = -Math.PI / 2 + targetRotation;
          
          // Update fire effect with boost - Get the effects group
          const rocketEffects = rocket.children.find(child => child instanceof THREE.Group) as THREE.Group;
          
          if (rocketEffects && rocketEffects.children.length >= 4) {
            // Get the fire effects from the rocketEffects group
            const fire = rocketEffects.children[0] as THREE.Mesh;
            const fireGlow = rocketEffects.children[1] as THREE.Mesh;
            const reverseFire = rocketEffects.children[2] as THREE.Mesh; 
            const reverseFireGlow = rocketEffects.children[3] as THREE.Mesh;
            
            // Forward fire effect
            if (fire && fireGlow && speedRef.current > 0) {
              fire.visible = true;
              fireGlow.visible = true;
              const boostScale = keysRef.current.space ? 2.5 : 1;
              fire.scale.y = (1 + speedRef.current * 2) * boostScale;
              fire.scale.x = keysRef.current.space ? 1.5 : 1;
              fire.scale.z = keysRef.current.space ? 1.5 : 1;
              
              // Fix fire position to prevent glitching
              fire.position.y = -2 - (fire.scale.y * 0.5);
              
              // Keep fire at the back of the rocket
              const fireMaterial = fire.material as THREE.MeshPhongMaterial;
              fireMaterial.opacity = Math.min(0.8, speedRef.current * 2);
              fireMaterial.emissiveIntensity = keysRef.current.space ? 2 : 0.5;
              fireMaterial.color.setHex(keysRef.current.space ? 0xff2200 : 0xff4400);
              
              // Update glow effect
              fireGlow.scale.copy(fire.scale);
              fireGlow.scale.multiplyScalar(1.3); // Make glow slightly larger
              fireGlow.position.copy(fire.position);
              
              const glowMaterial = fireGlow.material as THREE.MeshBasicMaterial;
              glowMaterial.opacity = fireMaterial.opacity * 0.5;
              glowMaterial.color.setHex(keysRef.current.space ? 0xff6600 : 0xff7700);
              
              // Hide reverse fire
              reverseFire.visible = false;
              reverseFireGlow.visible = false;
            } 
            // Reverse fire effect (blue flame)
            else if (reverseFire && reverseFireGlow && speedRef.current < 0) {
              reverseFire.visible = true;
              reverseFireGlow.visible = true;
              fire.visible = false;
              fireGlow.visible = false;
              
              const reverseBoostScale = keysRef.current.space ? 3 : 1.5; // Larger scale for space
              reverseFire.scale.y = (1 + Math.abs(speedRef.current) * 2) * reverseBoostScale;
              reverseFire.scale.x = keysRef.current.space ? 1.8 : 1.2;
              reverseFire.scale.z = keysRef.current.space ? 1.8 : 1.2;
              
              // Fix fire position to prevent glitching
              reverseFire.position.y = 2.5 + (reverseFire.scale.y * 0.4);
              
              // Update fire material
              const reverseFireMaterial = reverseFire.material as THREE.MeshPhongMaterial;
              reverseFireMaterial.opacity = Math.min(0.8, Math.abs(speedRef.current) * 2);
              reverseFireMaterial.emissiveIntensity = keysRef.current.space ? 2.5 : 0.8;
              reverseFireMaterial.color.setHex(keysRef.current.space ? 0x00aaff : 0x4466ff);
              
              // Update glow effect
              reverseFireGlow.scale.copy(reverseFire.scale);
              reverseFireGlow.scale.multiplyScalar(1.4); // Make glow slightly larger
              reverseFireGlow.position.copy(reverseFire.position);
              
              const reverseGlowMaterial = reverseFireGlow.material as THREE.MeshBasicMaterial;
              reverseGlowMaterial.opacity = reverseFireMaterial.opacity * 0.5;
              reverseGlowMaterial.color.setHex(keysRef.current.space ? 0x88ccff : 0x66aaff);
            } 
            else {
              // Hide both fires when not moving
              fire.visible = false;
              fireGlow.visible = false;
              reverseFire.visible = false;
              reverseFireGlow.visible = false;
            }
          }
        }
        
        // Update stars positions
        const starsPositions = stars.geometry.getAttribute('position');
        const cameraZ = camera.position.z;
        
        for (let i = 0; i < starsPositions.count; i++) {
          const z = starsPositions.getZ(i);
          const relativeZ = z - cameraZ;
          
          // If star is too far behind, move it forward with random offset
          if (relativeZ > starSpread/2) {
            const randomOffset = Math.random() * 50; // Add some randomness to prevent visible patterns
            starsPositions.setZ(i, cameraZ - starSpread/2 - randomOffset);
            // Randomize X and Y positions for more natural appearance
            starsPositions.setX(i, (Math.random() - 0.5) * starSpread);
            starsPositions.setY(i, (Math.random() - 0.5) * starSpread);
          }
          // If star is too far ahead, move it back with random offset
          else if (relativeZ < -starSpread/2) {
            const randomOffset = Math.random() * 50;
            starsPositions.setZ(i, cameraZ + starSpread/2 + randomOffset);
            // Randomize X and Y positions for more natural appearance
            starsPositions.setX(i, (Math.random() - 0.5) * starSpread);
            starsPositions.setY(i, (Math.random() - 0.5) * starSpread);
          }
        }
        starsPositions.needsUpdate = true;
        
        // Animate portfolio sections
        let closestSection: PortfolioSection | null = null;
        let closestDistance = Infinity;
        let isOnAnyPlatform = false;

        sectionsRef.current.forEach((section, index) => {
          // Hover animation for the whole section (affects platform)
          section.userData.hoverOffset += section.userData.speed;
          section.position.y = section.userData.originalY + Math.sin(section.userData.hoverOffset) * 0.5;
          
          // Calculate distance to rocket and adjust text height
          const distance = Math.abs(section.position.z - rocketRef.current!.position.z);
          const horizontalDistance = Math.sqrt(
            Math.pow(section.position.x - rocketRef.current!.position.x, 2) +
            Math.pow(section.position.y - rocketRef.current!.position.y, 2)
          );
          
          // Check if rocket is on this platform (close in all dimensions)
          const isOnPlatform = distance < 10 && horizontalDistance < 8 && Math.abs(speedRef.current) < 0.2;
          
          if (isOnPlatform) {
            isOnAnyPlatform = true;
          }
          
          const textHeightLift = distance < 30 ? 6 : 0; // Lift text up when rocket is within 30 units
          section.userData.textTargetY = section.userData.originalTextY + textHeightLift;
          
          // Track closest section
          if (distance < closestDistance && distance < 30) {
            closestDistance = distance;
            closestSection = portfolioSections[index];
          }
          
          // Smooth height transition for text
          const text = section.children[1] as THREE.Mesh;
          text.position.y += (section.userData.textTargetY - text.position.y) * 0.1;
          
          // Rotate slowly
          section.rotation.y += 0.001;
          
          // Fade based on distance to rocket
          const platform = section.children[0] as THREE.Mesh;
          
          const opacity = Math.max(0, 1 - (distance - 20) / 30);
          (platform.material as THREE.MeshPhongMaterial).opacity = opacity * 0.8;
          (text.material as THREE.MeshPhongMaterial).opacity = opacity;
        });

        // Update platform status
        setOnPlatform(isOnAnyPlatform);
        
        // Update active section
        setActiveSection(closestSection);

        // Animate and check collisions with asteroids
        let hasCollision = false;
        asteroidsRef.current.forEach(asteroid => {
          // Rotate slowly for a dynamic feel
          asteroid.rotation.x += 0.001;
          asteroid.rotation.y += 0.001;
          
          // Check if asteroid is too far behind the camera, if so, reposition it ahead
          if (asteroid.position.z > camera.position.z + 100) {
            asteroid.position.z = camera.position.z - (Math.random() * 400 + 100);
            asteroid.position.x = (Math.random() - 0.5) * 300;
            asteroid.position.y = (Math.random() - 0.5) * 200;
          }
          
          // Check for collision with rocket
          if (!asteroidCollision && rocketRef.current) { // Only check if not already in collision state
            const distance = asteroid.position.distanceTo(rocketRef.current.position);
            if (distance < 5) { // Collision radius
              hasCollision = true;
            }
          }
        });
        
        // Handle collision if detected
        if (hasCollision && !asteroidCollision) {
          setAsteroidCollision(true);
          // Reset collision state after 1.5 seconds
          collisionTimeoutRef.current = setTimeout(() => {
            setAsteroidCollision(false);
          }, 1500);
          
          // Add collision sound or effect here if desired
          // Slow down the rocket as collision penalty
          speedRef.current = speedRef.current * 0.3;
        }

        // Update rocket position state for display
        setRocketPosition({
          x: rocketRef.current.position.x,
          y: rocketRef.current.position.y,
          z: rocketRef.current.position.z
        });
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Update cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [mounted, rocketCustomization]);

  // Direct F key handling outside the ThreeJS context
  useEffect(() => {
    if (!mounted) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && onPlatform && activeSection) {
        console.log('F KEY PRESSED GLOBALLY!');
        setShowTablet(true);
        // Mark section as visited when tablet is opened
        handleSectionVisit(activeSection.title);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [mounted, onPlatform, activeSection]);

  // Track when tablet is shown via manual button click
  useEffect(() => {
    if (showTablet && activeSection) {
      // Mark section as visited when viewing content
      handleSectionVisit(activeSection.title);
    }
  }, [showTablet, activeSection]);

  // Enhanced fireworks component with multiple types of particles
  const Fireworks = () => {
    return (
      <>
        <div className="fullscreen-fireworks">
          {/* Standard firework particles */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={`particle-${i}`} 
              className="firework"
              style={{
                '--x': `${Math.random() * 100}vw`,
                '--y': `${Math.random() * 100}vh`,
                '--size': `${Math.random() * 3 + 0.5}rem`,
                '--color': `hsl(${Math.random() * 360}, 100%, 75%)`,
                '--duration': `${Math.random() * 2 + 1}s`,
                '--delay': `${Math.random() * 1.5}s`,
              } as React.CSSProperties}
            />
          ))}
          
          {/* Starbursts - larger explosion effects */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={`starburst-${i}`} 
              className="starburst"
              style={{
                '--x': `${Math.random() * 100}vw`,
                '--y': `${Math.random() * 100}vh`,
                '--size': `${Math.random() * 8 + 2}rem`,
                '--color': `hsl(${Math.random() * 360}, 100%, 70%)`,
                '--duration': `${Math.random() * 2.5 + 1.5}s`,
                '--delay': `${Math.random() * 3}s`,
              } as React.CSSProperties}
            />
          ))}
          
          {/* Streamers - trailing effects */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={`streamer-${i}`} 
              className="streamer"
              style={{
                '--startX': `${Math.random() * 100}vw`,
                '--startY': `${Math.random() * 30 + 70}vh`, // Start from bottom area
                '--endX': `${Math.random() * 100}vw`,
                '--endY': `${Math.random() * 50}vh`, // End higher up
                '--width': `${Math.random() * 4 + 1}px`,
                '--height': `${Math.random() * 100 + 50}px`,
                '--color': `hsl(${Math.random() * 360}, 100%, 75%)`,
                '--duration': `${Math.random() * 1 + 0.8}s`,
                '--delay': `${Math.random() * 4}s`,
              } as React.CSSProperties}
            />
          ))}
          
          {/* Glitter particles */}
          {Array.from({ length: 100 }).map((_, i) => (
            <div 
              key={`glitter-${i}`} 
              className="glitter"
              style={{
                '--x': `${Math.random() * 100}vw`,
                '--y': `${Math.random() * 100}vh`,
                '--size': `${Math.random() * 0.4 + 0.1}rem`,
                '--color': `hsl(${Math.random() * 60 + 40}, 100%, 75%)`, // Gold-ish colors
                '--duration': `${Math.random() * 3 + 2}s`,
                '--delay': `${Math.random() * 2}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
        
        {/* Celebratory Banner */}
        <div className="celebration-banner">
          <div className="celebration-text">All Points Discovered!</div>
          <div className="celebration-subtitle">Exploration Complete</div>
        </div>
      </>
    );
  };

  // Function to apply customization changes to the rocket
  const applyCustomization = (property: keyof RocketCustomization, color: number) => {
    setRocketCustomization(prev => ({
      ...prev,
      [property]: color
    }));
    
    // Apply changes to the meshes directly if rocket exists
    if (rocketRef.current) {
      const rocket = rocketRef.current.children[0] as THREE.Group;
      if (rocket) {
        // Find mesh components by their positions in the hierarchy
        const upperSection = rocket.children[0] as THREE.Mesh;
        const lowerSection = rocket.children[4] as THREE.Mesh;
        const windows = [
          rocket.children[1] as THREE.Mesh,
          rocket.children[2] as THREE.Mesh,
          rocket.children[3] as THREE.Mesh
        ];
        
        // Update upper section (body)
        if (property === 'bodyColor' && upperSection) {
          (upperSection.material as THREE.MeshPhongMaterial).color.setHex(color);
        }
        
        // Update lower section (accent)
        if (property === 'accentColor' && lowerSection) {
          (lowerSection.material as THREE.MeshPhongMaterial).color.setHex(color);
        }
        
        // Update windows
        if (property === 'windowColor') {
          windows.forEach(window => {
            if (window) {
              (window.material as THREE.MeshPhongMaterial).color.setHex(color);
            }
          });
        }
      }
    }
  };

  // Toggle customization panel
  const toggleCustomizationPanel = () => {
    setShowCustomizationPanel(prev => !prev);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Fullscreen fireworks effect */}
      {showFireworks && <Fireworks />}
      
      {/* Collision overlay effect */}
      {asteroidCollision && (
        <div className="collision-flash"></div>
      )}
      
      {/* Camera mode toggle button */}
      <button 
        onClick={toggleCameraMode}
        className="absolute top-4 left-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md z-10 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        {cameraMode === 'third-person' ? 'First Person View' : 'Third Person View'}
      </button>
      
      {/* Rocket customization toggle button */}
      <button 
        onClick={toggleCustomizationPanel}
        className="absolute top-16 left-4 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md z-10 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        Customize Rocket
      </button>
      
      {/* Customization panel */}
      {showCustomizationPanel && (
        <div className="absolute top-28 left-4 p-4 bg-gray-900 border border-gray-700 text-white rounded-md z-20 w-64">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Rocket Customization</h3>
            <button 
              onClick={toggleCustomizationPanel}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm mb-1">Body Color</label>
            <div className="flex space-x-2">
              {[0x888888, 0xff4444, 0x44ff44, 0x4444ff, 0xffff44].map(color => (
                <button
                  key={`body-${color}`}
                  className={`w-8 h-8 rounded-full border-2 ${rocketCustomization.bodyColor === color ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: `#${color.toString(16)}` }}
                  onClick={() => applyCustomization('bodyColor', color)}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm mb-1">Accent Color</label>
            <div className="flex space-x-2">
              {[0x777777, 0xcc3333, 0x33cc33, 0x3333cc, 0xcccc33].map(color => (
                <button
                  key={`accent-${color}`}
                  className={`w-8 h-8 rounded-full border-2 ${rocketCustomization.accentColor === color ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: `#${color.toString(16)}` }}
                  onClick={() => applyCustomization('accentColor', color)}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm mb-1">Window Color</label>
            <div className="flex space-x-2">
              {[0x44aaff, 0x66ffff, 0xaaffaa, 0xffaaff, 0xffffff].map(color => (
                <button
                  key={`window-${color}`}
                  className={`w-8 h-8 rounded-full border-2 ${rocketCustomization.windowColor === color ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: `#${color.toString(16)}` }}
                  onClick={() => applyCustomization('windowColor', color)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Counter */}
      <div className="absolute top-4 right-4 flex items-center">
        <div className={`progress-counter ${showFireworks ? 'completed' : ''}`}>
          <div className="relative">
            <div className="flex items-center justify-center">
              <span className="text-2xl font-bold mr-2">{visitedSections.size}</span>
              <span className="text-sm text-gray-300">/ {portfolioSections.length}</span>
            </div>
            <div className="progress-text mb-1">Points Visited</div>
            
            {/* Section badges */}
            <div className="flex justify-center mt-1 space-x-1">
              {getBadgeColors().map((color, index) => (
                <div 
                  key={index} 
                  className={`section-badge ${visitedSections.size > index ? 'visited' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug info, manual trigger, and reset button */}
      <div className="absolute bottom-0 left-0 p-2 bg-black bg-opacity-50 text-white text-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">Debug Info</span>
          <button 
            onClick={resetRocket}
            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white ml-2"
          >
            Reset Position
          </button>
        </div>
        
        {/* Position coordinates */}
        <div className="mb-2 p-1 bg-gray-800 rounded">
          <div className="font-bold mb-1">Rocket Position:</div>
          <div>X: {rocketPosition.x.toFixed(2)}</div>
          <div>Y: {rocketPosition.z.toFixed(2)}</div>
          <div>Z: {rocketPosition.y.toFixed(2)}</div>
        </div>
        
        <div>On platform: {onPlatform ? 'YES' : 'NO'}</div>
        <div>Speed: {speedRef.current.toFixed(2)}</div>
        <div>Camera mode: {cameraMode}</div>
        <div>Active section: {activeSection?.title || 'None'}</div>
        <div>Asteroid collision: {asteroidCollision ? 'YES' : 'NO'}</div>
        <button 
          onClick={() => {
            if (onPlatform && activeSection) {
              setShowTablet(true);
            }
          }}
          className="mt-2 px-2 py-1 bg-red-500 rounded text-white"
        >
          Manual Trigger
        </button>
      </div>
      
      {/* Tablet popup - now fully opaque */}
      {showTablet && activeSection && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 max-w-2xl bg-slate-800 border-4 border-slate-600 rounded-lg p-6 text-white shadow-2xl z-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold" style={{ color: `#${activeSection.color.toString(16).padStart(6, '0')}` }}>
              {activeSection.title}
            </h2>
            <button 
              onClick={() => setShowTablet(false)}
              className="bg-slate-700 hover:bg-slate-600 rounded-full p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="prose prose-invert max-h-[60vh] overflow-y-auto">
            {activeSection.content ? (
              <div dangerouslySetInnerHTML={{ __html: activeSection.content.replace(/\n/g, '<br>') }} />
            ) : (
              <p>{activeSection.description}</p>
            )}
          </div>
          
          {activeSection.link && (
            <div className="mt-4">
              <a 
                href={activeSection.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Learn More
              </a>
            </div>
          )}
        </div>
      )}
      
      {/* Platform indicator - now fully opaque */}
      {onPlatform && !showTablet && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full text-lg font-bold animate-bounce">
          Press F to interact
        </div>
      )}
      
      {/* Styles for counter, fireworks, and new features */}
      <style jsx>{`
        .progress-counter {
          background: rgba(0, 0, 0, 0.6);
          border-radius: 1rem;
          padding: 0.75rem 1.25rem;
          color: white;
          box-shadow: 0 0 15px rgba(0, 100, 255, 0.3);
          position: relative;
          transition: all 0.3s ease;
          z-index: 10;
          min-width: 150px;
          text-align: center;
        }
        
        .progress-counter.completed {
          background: rgba(20, 20, 40, 0.8);
          box-shadow: 0 0 20px rgba(100, 200, 255, 0.6), 0 0 30px rgba(255, 215, 0, 0.4);
          transform: scale(1.05);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 20px rgba(100, 200, 255, 0.6), 0 0 30px rgba(255, 215, 0, 0.4); }
          50% { box-shadow: 0 0 30px rgba(100, 200, 255, 0.8), 0 0 40px rgba(255, 215, 0, 0.6); }
          100% { box-shadow: 0 0 20px rgba(100, 200, 255, 0.6), 0 0 30px rgba(255, 215, 0, 0.4); }
        }
        
        .progress-text {
          font-size: 0.7rem;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .section-badge {
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 50%;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .section-badge.visited {
          transform: scale(1.1);
          box-shadow: 0 0 8px currentColor;
          animation: badge-pulse 1.5s infinite;
        }
        
        @keyframes badge-pulse {
          0% { transform: scale(1.1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1.1); }
        }
        
        .fullscreen-fireworks {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 20;
          perspective: 1000px;
        }
        
        .celebration-banner {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid gold;
          border-radius: 1rem;
          padding: 2rem 3rem;
          text-align: center;
          z-index: 30;
          animation: banner-appear 1s ease-out forwards;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
        }
        
        .celebration-text {
          font-size: 2.5rem;
          font-weight: bold;
          color: white;
          text-shadow: 0 0 10px gold;
          margin-bottom: 0.5rem;
        }
        
        .celebration-subtitle {
          font-size: 1.2rem;
          color: gold;
          opacity: 0.9;
        }
        
        @keyframes banner-appear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          70% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        .firework {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background-color: var(--color);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--color), 0 0 20px var(--color);
          opacity: 0;
          animation: firework var(--duration) ease-out var(--delay);
        }
        
        @keyframes firework {
          0% {
            opacity: 1;
            transform: translate(calc(var(--x) * 0.5), calc(var(--y) * 0.5)) scale(0);
          }
          50% {
            opacity: 1;
            transform: translate(var(--x), var(--y)) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--x), var(--y)) scale(0.2);
            box-shadow: 0 0 40px var(--color), 0 0 60px var(--color);
          }
        }
        
        .starburst {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background: radial-gradient(circle, var(--color) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
          opacity: 0;
          filter: blur(3px);
          animation: starburst var(--duration) ease-out var(--delay);
        }
        
        @keyframes starburst {
          0% {
            opacity: 0;
            transform: translate(var(--x), var(--y)) scale(0.1) rotate(0deg);
          }
          20% {
            opacity: 1;
            transform: translate(var(--x), var(--y)) scale(1) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--x), var(--y)) scale(1.5) rotate(360deg);
          }
        }
        
        .streamer {
          position: absolute;
          left: var(--startX);
          bottom: var(--startY);
          width: var(--width);
          height: var(--height);
          background: linear-gradient(to top, var(--color), transparent);
          transform-origin: bottom center;
          opacity: 0;
          filter: blur(1px);
          animation: streamer var(--duration) ease-out var(--delay);
        }
        
        @keyframes streamer {
          0% {
            opacity: 0.8;
            transform: translateY(0) scaleY(0.1);
          }
          80% {
            opacity: 1;
            transform: translate(calc(var(--endX) - var(--startX)), calc(var(--endY) - var(--startY))) scaleY(1);
          }
          100% {
            opacity: 0;
            transform: translate(calc(var(--endX) - var(--startX)), calc(var(--endY) - var(--startY))) scaleY(0.8);
          }
        }
        
        .glitter {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background-color: var(--color);
          border-radius: 50%;
          opacity: 0;
          animation: glitter var(--duration) ease-in-out var(--delay) infinite;
        }
        
        @keyframes glitter {
          0%, 100% {
            opacity: 0;
            transform: translate(var(--x), var(--y)) scale(0.1);
          }
          50% {
            opacity: 1;
            transform: translate(var(--x), var(--y)) scale(1);
            box-shadow: 0 0 5px var(--color), 0 0 10px var(--color);
          }
        }
        
        .collision-flash {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(255, 0, 0, 0.3);
          pointer-events: none;
          z-index: 25;
          animation: flash 0.5s ease-out 3;
        }
        
        @keyframes flash {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RocketScene; 