'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface PortfolioSection {
  position: number;  // Z position in space
  title: string;
  description: string;
  color: number;
}

const portfolioSections: PortfolioSection[] = [
  {
    position: -50,
    title: "Welcome!",
    description: "Press W to fly forward, S to reverse",
    color: 0x4a9eff
  },
  {
    position: -150,
    title: "About Me",
    description: "Software Engineer & Creator",
    color: 0xff4a4a
  },
  {
    position: -250,
    title: "Projects",
    description: "Check out my work",
    color: 0x4aff4a
  },
  {
    position: -350,
    title: "Skills",
    description: "Technologies I work with",
    color: 0xff4aff
  }
];

const RocketScene = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rocketRef = useRef<THREE.Group | undefined>(undefined);
  const speedRef = useRef(0);
  const rollRef = useRef(0);
  const keysRef = useRef({ w: false, s: false, a: false, d: false, space: false });
  const sectionsRef = useRef<THREE.Group[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Keyboard controls
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'w') keysRef.current.w = true;
      if (event.key === 's') keysRef.current.s = true;
      if (event.key === 'a') keysRef.current.a = true;
      if (event.key === 'd') keysRef.current.d = true;
      if (event.key === ' ') keysRef.current.space = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'w') keysRef.current.w = false;
      if (event.key === 's') keysRef.current.s = false;
      if (event.key === 'a') keysRef.current.a = false;
      if (event.key === 'd') keysRef.current.d = false;
      if (event.key === ' ') keysRef.current.space = false;
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

      // Position the section in space
      sectionGroup.position.set(0, -2, section.position);
      
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

      // Handle roll
      const rollSpeed = 0.1;
      if (keysRef.current.a) {
        rollRef.current = Math.min(rollRef.current + rollSpeed, Math.PI * 0.5);
      } else if (keysRef.current.d) {
        rollRef.current = Math.max(rollRef.current - rollSpeed, -Math.PI * 0.5);
      } else {
        rollRef.current *= 0.95; // Return to neutral position
      }

      if (rocketRef.current) {
        // Move camera and rocket
        camera.position.z -= speedRef.current;
        rocketRef.current.position.z = camera.position.z - 20;
        
        // Apply roll rotation to the container (which doesn't affect the rocket's pitch)
        rocketRef.current.rotation.z = rollRef.current;
        
        // Apply pitch based on speed to the rocket itself
        const targetRotation = -speedRef.current * 0.2;
        const rocket = rocketRef.current.children[0] as THREE.Group;
        rocket.rotation.x = -Math.PI / 2 + targetRotation;
        
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

        // Update fire effect with boost
        const fire = rocket.children[2] as THREE.Mesh;
        if (fire && speedRef.current > 0) {
          fire.visible = true;
          const boostScale = keysRef.current.space ? 2.5 : 1;
          fire.scale.y = (1 + speedRef.current * 2) * boostScale;
          fire.scale.x = keysRef.current.space ? 1.5 : 1;
          fire.scale.z = keysRef.current.space ? 1.5 : 1;
          // Keep fire at the back of the rocket
          const fireMaterial = fire.material as THREE.MeshPhongMaterial;
          fireMaterial.opacity = Math.min(0.8, speedRef.current * 2);
          fireMaterial.emissiveIntensity = keysRef.current.space ? 2 : 0.5;
          fireMaterial.color.setHex(keysRef.current.space ? 0xff2200 : 0xff4400);
        } else {
          fire.visible = false;
        }

        // Animate portfolio sections
        sectionsRef.current.forEach((section) => {
          // Hover animation for the whole section (affects platform)
          section.userData.hoverOffset += section.userData.speed;
          section.position.y = section.userData.originalY + Math.sin(section.userData.hoverOffset) * 0.5;
          
          // Calculate distance to rocket and adjust text height
          const distance = Math.abs(section.position.z - rocketRef.current!.position.z);
          const textHeightLift = distance < 30 ? 6 : 0; // Lift text up when rocket is within 30 units
          section.userData.textTargetY = section.userData.originalTextY + textHeightLift;
          
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

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0"
      style={{ background: 'black' }}
    />
  );
};

export default RocketScene; 