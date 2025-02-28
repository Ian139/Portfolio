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

  // Function to reset rocket position
  const resetRocket = () => {
    if (rocketRef.current && initialCameraPosition.current) {
      speedRef.current = 0;
      lateralSpeedRef.current = 0;
      rollRef.current = 0;
      
      // Reset camera position
      const camera = rocketRef.current.parent?.children.find(
        child => child instanceof THREE.PerspectiveCamera
      ) as THREE.PerspectiveCamera;
      
      if (camera) {
        camera.position.set(
          initialCameraPosition.current.x, 
          initialCameraPosition.current.y, 
          initialCameraPosition.current.z
        );
        
        // Reset rocket position relative to camera
        rocketRef.current.position.x = 0;
        rocketRef.current.position.z = camera.position.z - 20;
        rocketRef.current.rotation.z = 0;
        
        // Reset the rocket's rotation
        const rocket = rocketRef.current.children[0] as THREE.Group;
        if (rocket) {
          rocket.rotation.x = -Math.PI / 2;
        }
      }
    }
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
      color: 0x888888,
      flatShading: true 
    });
    const upperSection = new THREE.Mesh(upperGeometry, upperMaterial);
    upperSection.position.y = 1;
    rocket.add(upperSection);

    // Lower section (slightly larger octagonal)
    const lowerGeometry = new THREE.CylinderGeometry(1.4, 1.4, 1.5, 8, 1);
    const lowerMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x777777,
      flatShading: true 
    });
    const lowerSection = new THREE.Mesh(lowerGeometry, lowerMaterial);
    lowerSection.position.y = -0.5;
    rocket.add(lowerSection);

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
    rocket.add(fire);
    
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
    rocket.add(fireGlow);
    
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
    rocket.add(reverseFire);
    
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
    rocket.add(reverseFireGlow);
    
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
      // Update sun position for day/night cycle (30 second cycle)
      cycleTimeRef.current = (cycleTimeRef.current + 1) % (30 * 60); // 30 seconds at 60fps
      const cycleProgress = cycleTimeRef.current / (30 * 60);
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
        
        // Position rocket relative to camera
        rocketRef.current.position.z = camera.position.z - 20;
        rocketRef.current.position.x = camera.position.x;
        
        // Apply roll and slight turning to the rocket container
        rocketRef.current.rotation.z = -rollRef.current;
        // Add yaw (turn) based on lateral movement - now inverted to face opposite direction
        rocketRef.current.rotation.y = -lateralSpeedRef.current * 0.5;
        
        // Apply pitch based on speed to the rocket itself
        const targetRotation = -speedRef.current * 0.2;
        const rocket = rocketRef.current.children[0] as THREE.Group;
        rocket.rotation.x = -Math.PI / 2 + targetRotation;
        
        // Update fire effect with boost
        const fire = rocket.children[2] as THREE.Mesh;
        const fireGlow = rocket.children[3] as THREE.Mesh;
        const reverseFire = rocket.children[4] as THREE.Mesh; 
        const reverseFireGlow = rocket.children[5] as THREE.Mesh;
        
        // Forward fire effect
        if (fire && speedRef.current > 0) {
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
        else if (reverseFire && speedRef.current < 0) {
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
        
        // Keep camera looking at rocket
        camera.lookAt(rocketRef.current.position);

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
  }, [mounted]);

  // Direct F key handling outside the ThreeJS context
  useEffect(() => {
    if (!mounted) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && onPlatform && activeSection) {
        console.log('F KEY PRESSED GLOBALLY!');
        setShowTablet(true);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [mounted, onPlatform, activeSection]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Debug info, manual trigger, and reset button */}
      <div className="absolute top-0 left-0 p-2 bg-black bg-opacity-50 text-white text-xs">
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
        <div>F key pressed: {keysRef.current.f ? 'YES' : 'NO'}</div>
        <div>Active section: {activeSection?.title || 'None'}</div>
        <button 
          onClick={() => onPlatform && activeSection && setShowTablet(true)}
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
      
      {activeSection && !showTablet && (
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-white bg-black">
          <h2 className="text-xl font-bold">{activeSection.title}</h2>
          <p>{activeSection.description}</p>
        </div>
      )}
    </div>
  );
};

export default RocketScene; 