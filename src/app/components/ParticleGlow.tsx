'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleBackground = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    // Orthographic camera for 2D view
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0.2); // Slight background color
    containerRef.current.appendChild(renderer.domElement);
    
    // Position camera for 2D view
    camera.position.z = 100;
    
    // Create particles with sphere geometry - now larger
    const particles = new THREE.Group();
    const particleCount = 100; // Reduced count for better performance with larger particles
    const particleGeometry = new THREE.SphereGeometry(21, 16, 16); // Increased size by 3x
    
    for (let i = 0; i < particleCount; i++) {
      // Create material with random blue shade
      const r = 0.3 + Math.random() * 0.2;
      const g = 0.3 + Math.random() * 0.2;
      const b = 0.8 + Math.random() * 0.2;
      
      // Create a glowing material
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(r, g, b) }
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 color;
          void main() {
            // Changed the glow formula to make it brighter in the center
            float intensity = 0.8 + 0.4 * dot(vNormal, vec3(0.0, 0.0, 1.0));
            gl_FragColor = vec4(color * intensity, 0.7);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
      });

      const particle = new THREE.Mesh(particleGeometry, glowMaterial);
      
      // Position randomly in 2D space (z=0 for all particles)
      particle.position.x = (Math.random() - 0.5) * window.innerWidth;
      particle.position.y = (Math.random() - 0.5) * window.innerHeight;
      particle.position.z = 0;
      
      // Store original opacity for animation - slower movement speeds
      particle.userData = {
        originalOpacity: glowMaterial.uniforms.color.value.opacity,
        originalSize: particle.scale.x,
        speedX: (Math.random() - 0.5) * 0.1, // Reduced from 0.2 to 0.1 for slower movement
        speedY: (Math.random() - 0.5) * 0.1  // Reduced from 0.2 to 0.1 for slower movement
      };
      
      particles.add(particle);
    }
    
    scene.add(particles);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    
    // Mouse event handlers
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = {
        x: event.clientX - window.innerWidth / 2,
        y: -(event.clientY - window.innerHeight / 2)
      };
    };
    
    const handleResize = () => {
      camera.left = window.innerWidth / -2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = window.innerHeight / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      // Update each particle
      particles.children.forEach((particle) => {
        const mesh = particle as THREE.Mesh;
        const material = mesh.material as THREE.ShaderMaterial;
        
        // Calculate distance to mouse
        const dx = mesh.position.x - mousePosition.current.x;
        const dy = mesh.position.y - mousePosition.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Mouse repulsion effect - particles are pushed away from mouse
        const repulsionRadius = 200; // Area of effect for repulsion
        const repulsionStrength = 0.5; // Strength of repulsion force
        
        if (distance < repulsionRadius) {
          // Calculate repulsion vector - stronger when closer
          const factor = (1 - distance / repulsionRadius) * repulsionStrength;
          
          // Normalize direction vector
          const dirX = dx === 0 ? 0 : dx / distance;
          const dirY = dy === 0 ? 0 : dy / distance;
          
          // Apply repulsion force - push away from mouse
          mesh.position.x += dirX * factor * 5; // Amplify the effect
          mesh.position.y += dirY * factor * 5;
          
          // Particles near mouse glow brighter
          material.uniforms.color.value.opacity = mesh.userData.originalOpacity + factor * 0.7;
          
          // Scale up particles when repelled
          const scaleFactor = 1 + factor * 1.5;
          mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        } else {
          // Reset to original opacity when not being repelled
          material.uniforms.color.value.opacity = mesh.userData.originalOpacity;
          mesh.scale.set(1, 1, 1);
        }
        
        // Regular gentle movement - apply only when not being strongly repelled
        if (distance > repulsionRadius * 0.5) {
          mesh.position.x += mesh.userData.speedX;
          mesh.position.y += mesh.userData.speedY;
        }
        
        // Wrap around edges
        if (mesh.position.x > window.innerWidth / 2) {
          mesh.position.x = -window.innerWidth / 2;
        } else if (mesh.position.x < -window.innerWidth / 2) {
          mesh.position.x = window.innerWidth / 2;
        }
        
        if (mesh.position.y > window.innerHeight / 2) {
          mesh.position.y = -window.innerHeight / 2;
        } else if (mesh.position.y < -window.innerHeight / 2) {
          mesh.position.y = window.innerHeight / 2;
        }
      });
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // Dispose of resources
      particles.children.forEach(particle => {
        const mesh = particle as THREE.Mesh;
        const material = mesh.material as THREE.ShaderMaterial;
        mesh.geometry.dispose();
        material.dispose();
      });
      renderer.dispose();
    };
  }, []);
  
  return (
    <>
      <div 
        ref={containerRef} 
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex:0,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      />
    </>
  );
};

export default ParticleBackground;