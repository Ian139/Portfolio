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
  
  // Mouse look controls for first-person mode
  const [mouseLookEnabled, setMouseLookEnabled] = useState(false);
  const mouseSensitivityRef = useRef(0.002);
  const mouseRotationRef = useRef({ x: 0, y: 0 });
  const isPointerLockedRef = useRef(false);

  // Function to handle camera mode toggle
  const toggleCameraMode = () => {
    setCameraMode(prev => {
      const newMode = prev === 'third-person' ? 'first-person' : 'third-person';
      console.log(`Switching camera mode to: ${newMode}`);
      
      // Get camera reference
      if (rocketRef.current) {
        const camera = rocketRef.current.parent?.children.find(
          child => child instanceof THREE.PerspectiveCamera
        ) as THREE.PerspectiveCamera;
        
        if (camera) {
          // Adjust FOV based on mode
          camera.fov = newMode === 'first-person' ? 90 : 75;
          camera.updateProjectionMatrix();
          
          const rocket = rocketRef.current.children[0] as THREE.Group;
          
          // Force immediate transition to the new view mode
          if (newMode === 'first-person') {
            // Switch to first-person view
            console.log("Switching to first-person view");
            
            // Make upper section transparent
            if (rocket) {
              const upperSection = rocket.children[0] as THREE.Mesh;
              if (upperSection && upperSection.material) {
                (upperSection.material as THREE.MeshPhongMaterial).opacity = 0.2;
                (upperSection.material as THREE.MeshPhongMaterial).transparent = true;
              }
            }
            
            // Position camera immediately inside rocket
            camera.position.copy(rocketRef.current.position);
            camera.position.y += 1.5; // Cockpit height
            
            // Set camera rotation to look forward
            camera.rotation.set(0, 0, 0); // Change from Math.PI to 0 to look forward
            camera.rotation.order = 'YXZ'; // Set rotation order to avoid gimbal lock
            
            // Automatically enable mouse look in first-person
            setMouseLookEnabled(true);
            
            // Request pointer lock with a slight delay to ensure UI updates first
            setTimeout(() => {
              if (containerRef.current && !isPointerLockedRef.current) {
                containerRef.current.requestPointerLock();
              }
            }, 50);
          } else {
            // Switch to third-person view
            console.log("Switching to third-person view");
            
            // Make rocket fully visible
            if (rocket) {
              const upperSection = rocket.children[0] as THREE.Mesh;
              if (upperSection && upperSection.material) {
                (upperSection.material as THREE.MeshPhongMaterial).opacity = 1.0;
                (upperSection.material as THREE.MeshPhongMaterial).transparent = false;
              }
            }
            
            // Position camera behind rocket
            camera.position.z = rocketRef.current.position.z + 20;
            camera.position.x = rocketRef.current.position.x;
            camera.position.y = 8;
            
            // Look at rocket
            camera.lookAt(rocketRef.current.position);
            
            // Keep mouse look enabled for third-person turning
            setMouseLookEnabled(true);
          }
        }
      }
      
      return newMode;
    });
  };

  // Function to reset the rocket position
  const resetRocket = () => {
    if (rocketRef.current) {
      // Reset position
      rocketRef.current.position.set(0, 0, 0);
      
      // Reset speed and rotation
      speedRef.current = 0;
      
      // Reset camera position
      const camera = rocketRef.current.parent?.children.find(
        child => child instanceof THREE.PerspectiveCamera
      ) as THREE.PerspectiveCamera;
      
      if (camera) {
        if (cameraMode === 'third-person') {
          camera.position.set(0, 8, 20);
          camera.lookAt(rocketRef.current.position);
        } else {
          camera.position.copy(rocketRef.current.position);
          camera.position.y += 1.5; // Cockpit height
          camera.rotation.set(0, 0, 0);
        }
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

    // Update keyboard handler - we'll only use W/S keys now
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'w') keysRef.current.w = true;
      if (event.key === 's') keysRef.current.s = true;
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
      if (event.key === ' ') keysRef.current.space = false;
      if (event.key === 'f' || event.key === 'F') keysRef.current.f = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse move handler for camera control (both first and third person)
    const handleMouseMove = (event: MouseEvent) => {
      if (mouseLookEnabled && isPointerLockedRef.current) {
        // Update rotation reference based on mouse movement
        // Horizontal movement affects Y rotation (yaw)
        // Negative movementX means looking right, positive means looking left
        mouseRotationRef.current.y -= event.movementX * mouseSensitivityRef.current;
        
        // Vertical movement affects X rotation (pitch)
        // Negative movementY means looking up, positive means looking down
        mouseRotationRef.current.x -= event.movementY * mouseSensitivityRef.current;
        
        // Clamp the vertical rotation to prevent over-rotation
        mouseRotationRef.current.x = Math.max(
          -Math.PI / 2, // Looking straight up
          Math.min(Math.PI / 2, mouseRotationRef.current.x) // Looking straight down
        );
        
        // Log rotation values for debugging
        console.log(`Rotation - X: ${mouseRotationRef.current.x.toFixed(2)}, Y: ${mouseRotationRef.current.y.toFixed(2)}`);
      }
    };
    
    // Pointer lock change handler
    const handlePointerLockChange = () => {
      const wasPointerLocked = isPointerLockedRef.current;
      isPointerLockedRef.current = document.pointerLockElement === containerRef.current;
      
      // If pointer lock was exited but mouse look is still enabled
      if (!isPointerLockedRef.current && wasPointerLocked && mouseLookEnabled) {
        console.log("Pointer lock lost unexpectedly");
        
        // Check if this was due to clicking a UI element (don't automatically relock)
        // We'll relock when user clicks back on the container
      }
    };
    
    // Handle mouse click on container to re-enable pointer lock if needed
    const handleContainerClick = () => {
      if (mouseLookEnabled && !isPointerLockedRef.current) {
        console.log("Requesting pointer lock after container click");
        if (containerRef.current) {
          containerRef.current.requestPointerLock();
        }
      }
    };

    // Add event listeners for mouse control
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    // Add click handler for container to re-enable pointer lock
    containerRef.current?.addEventListener('click', handleContainerClick);

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

      if (rocketRef.current) {
        // Different movement logic based on camera mode
        if (cameraMode === 'third-person') {
          // THIRD PERSON MODE
          // In third-person mode, we'll still use mouse movement for turning
          // Calculate turning direction based on mouse position
          const turnDirection = mouseRotationRef.current.y;
          
          // Get pitch factor for vertical movement (from mouse look)
          const pitchFactor = mouseRotationRef.current.x;
          
          // Move camera based on input, turn direction, and pitch
          camera.position.z -= speedRef.current * Math.cos(turnDirection);
          camera.position.x -= speedRef.current * Math.sin(turnDirection);
          // Add vertical movement based on pitch - looking up moves up, looking down moves down
          camera.position.y += speedRef.current * Math.sin(pitchFactor) * 0.8;
          
          // Position rocket relative to camera but facing in the direction of movement
          rocketRef.current.position.z = camera.position.z - 20 * Math.cos(turnDirection);
          rocketRef.current.position.x = camera.position.x - 20 * Math.sin(turnDirection);
          rocketRef.current.position.y = camera.position.y - 8; // Adjust vertical position to maintain distance
          
          // Always make the rocket face the same direction you're looking
          rocketRef.current.rotation.y = turnDirection;
          
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
            
            // Apply pitch based on both speed and mouse look
            const speedPitch = -speedRef.current * 0.2; // Original speed-based pitch
            const lookPitch = mouseRotationRef.current.x * 0.5; // Scale down the look pitch for better visuals
            rocket.rotation.x = -Math.PI / 2 + speedPitch + lookPitch;
          }
          
          // Set camera to look at the rocket
          camera.lookAt(rocketRef.current.position);
        } else {
          // FIRST PERSON MODE
          
          // Always ensure mouse look is enabled in first-person mode
          if (!mouseLookEnabled) {
            setMouseLookEnabled(true);
          }
          
          // Occasional check to request pointer lock if not locked
          // Only request lock occasionally to prevent excessive requests
          if (mouseLookEnabled && !isPointerLockedRef.current && Math.random() < 0.01) {
            console.log("Requesting pointer lock from animation loop");
            if (containerRef.current) {
              containerRef.current.requestPointerLock();
            }
          }
          
          // Create direction vector for 3D movement (including vertical)
          const direction = new THREE.Vector3();
          
          // Get the forward direction (-Z axis)
          direction.set(0, 0, -1);
          
          // Apply full rotation (pitch and yaw) to get 3D direction
          const euler = new THREE.Euler(mouseRotationRef.current.x, mouseRotationRef.current.y, 0, 'YXZ');
          direction.applyEuler(euler);
          
          // Move in the direction we're facing (including vertical)
          const moveSpeed = speedRef.current;
          
          // Apply movement in the 3D direction we're looking
          rocketRef.current.position.x += direction.x * moveSpeed;
          rocketRef.current.position.z += direction.z * moveSpeed;
          rocketRef.current.position.y += direction.y * moveSpeed;
          
          // Always rotate rocket to match camera direction in first-person mode
          rocketRef.current.rotation.y = mouseRotationRef.current.y;
          
          const rocket = rocketRef.current.children[0] as THREE.Group;
          if (rocket) {
            // Apply pitch to the rocket based on the camera's pitch
            rocket.rotation.x = -Math.PI / 2 + mouseRotationRef.current.x;
            
            // Make cockpit transparent
            const upperSection = rocket.children[0] as THREE.Mesh;
            if (upperSection && upperSection.material) {
              (upperSection.material as THREE.MeshPhongMaterial).opacity = 0.2;
              (upperSection.material as THREE.MeshPhongMaterial).transparent = true;
            }
            
            // Position camera inside the rocket cockpit
            camera.position.copy(rocketRef.current.position);
            camera.position.y += 1.5; // Cockpit height
            
            // Apply mouse rotation directly to camera rotation
            camera.rotation.order = 'YXZ'; // Set rotation order to avoid gimbal lock
            camera.rotation.x = mouseRotationRef.current.x;
            camera.rotation.y = mouseRotationRef.current.y;
            camera.rotation.z = 0;
          }
        }
        
        // Apply roll and slight turning to the rocket container (in both modes)
        rocketRef.current.rotation.z = 0;
        
        // Get the rocket model for fire effects and other shared behaviors
        const rocket = rocketRef.current.children[0] as THREE.Group;
        
        // Update fire effect with boost - Get the effects group
        if (rocket) {
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
              fireGlow.visible = false;
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
              
              // Update glow effect - still update in case we want to turn it on later
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
              reverseFireGlow.visible = false;
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
              
              // Update glow effect - still update in case we want to turn it on later
              reverseFireGlow.scale.copy(reverseFire.scale);
              reverseFireGlow.scale.multiplyScalar(1.4); // Make glow slightly larger
              reverseFireGlow.position.copy(reverseFire.position);
              
              const reverseGlowMaterial = reverseFireGlow.material as THREE.MeshBasicMaterial;
              reverseGlowMaterial.opacity = reverseFireMaterial.opacity * 0.5;
              reverseGlowMaterial.color.setHex(keysRef.current.space ? 0x88ccff : 0x66aaff);
            } 
            // No movement
            else {
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

        // We've removed asteroid animation and collision checking
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
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      containerRef.current?.removeEventListener('click', handleContainerClick);
      
      if (document.pointerLockElement === containerRef.current) {
        document.exitPointerLock();
      }
      
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [mounted, rocketCustomization, mouseLookEnabled, mouseSensitivityRef.current]);

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
    
    // FIX: Re-enable pointer lock if we're in first-person mode and mouse look is enabled
    // This ensures clicking on customization colors doesn't break the mouse look
    if (cameraMode === 'first-person' && mouseLookEnabled) {
      // Small timeout to let the click event fully resolve
      setTimeout(() => {
        if (containerRef.current && !isPointerLockedRef.current) {
          containerRef.current.requestPointerLock();
        }
      }, 50);
    }
  };

  // Toggle customization panel
  const toggleCustomizationPanel = () => {
    const newState = !showCustomizationPanel;
    setShowCustomizationPanel(newState);
    
    // FIX: When closing the panel, re-enable pointer lock if needed
    if (!newState && cameraMode === 'first-person' && mouseLookEnabled) {
      setTimeout(() => {
        if (containerRef.current && !isPointerLockedRef.current) {
          containerRef.current.requestPointerLock();
        }
      }, 50);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative w-full h-full overflow-hidden" ref={containerRef}>
      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-4 z-10">
        <button
          className="bg-green-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-green-600 transition-colors"
          onClick={toggleCameraMode}
        >
          {cameraMode === 'third-person' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>Switch to First Person</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Switch to Third Person</span>
            </>
          )}
        </button>
        
        <button
          className="bg-purple-500 text-white py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-purple-600 transition-colors"
          onClick={toggleCustomizationPanel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span>Customize Rocket</span>
        </button>

        {cameraMode === 'first-person' && (
          <div className="bg-black bg-opacity-70 text-white py-2 px-4 rounded-lg flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
            </svg>
            <span>Move mouse to look around</span>
          </div>
        )}
        
        {/* Add mouse look status indicator */}
        {mouseLookEnabled && (
          <div className="bg-black bg-opacity-70 text-white py-2 px-4 rounded-lg flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>Mouse Look Active</span>
          </div>
        )}
      </div>
      
      {/* Fullscreen fireworks effect */}
      {showFireworks && <Fireworks />}
      
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
        
        <div>On platform: {onPlatform ? 'YES' : 'NO'}</div>
        <div>Speed: {speedRef.current.toFixed(2)}</div>
        <div>Camera mode: {cameraMode}</div>
        <div>Active section: {activeSection?.title || 'None'}</div>
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