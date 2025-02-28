'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const RocketScene = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rocketRef = useRef<THREE.Group | undefined>(undefined);
  const speedRef = useRef(0);
  const keysRef = useRef({ w: false, s: false });

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
      opacity: 0.8
    });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.y = -2;
    fire.rotation.x = Math.PI; // Rotate fire to point backward
    rocket.add(fire);
    
    // Rotate entire rocket to face forward
    rocket.rotation.x = -Math.PI / 2; // Changed from Math.PI / 2 to face forward

    scene.add(rocket);
    rocketRef.current = rocket;

    // Add stars (particles)
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000; // Increased star count
    const starsPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starsPositions[i] = (Math.random() - 0.5) * 200;     // x
      starsPositions[i + 1] = (Math.random() - 0.5) * 200; // y
      starsPositions[i + 2] = (Math.random() - 0.5) * 200; // z
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xFFFFFF, 
      size: 0.2,  // Increased star size
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
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'w') keysRef.current.w = false;
      if (event.key === 's') keysRef.current.s = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation loop
    const animate = () => {
      if (keysRef.current.w) {  // W for forward
        speedRef.current = Math.min(speedRef.current + 0.01, 0.5);
      } else if (keysRef.current.s) {  // S for backward
        speedRef.current = Math.max(speedRef.current - 0.01, -0.5);
      } else {
        speedRef.current *= 0.98; // Gradual slowdown
      }

      if (rocketRef.current) {
        // Move both camera and rocket forward (negative Z for forward movement)
        camera.position.z -= speedRef.current;
        rocketRef.current.position.z = camera.position.z - 20;
        
        // Tilt the rocket based on acceleration
        const targetRotation = -speedRef.current * 0.2; // Reversed tilt direction
        rocketRef.current.rotation.z += (targetRotation - rocketRef.current.rotation.z) * 0.1;

        // Keep camera looking at rocket
        camera.lookAt(rocketRef.current.position);

        // Update fire effect based on speed (show fire when moving forward/W key)
        const fire = rocketRef.current.children[2] as THREE.Mesh;
        if (fire && speedRef.current > 0) {
          fire.visible = true;
          fire.scale.y = 1 + speedRef.current * 2;
          (fire.material as THREE.MeshPhongMaterial).opacity = Math.min(0.8, speedRef.current * 2);
        } else {
          fire.visible = false;
        }
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