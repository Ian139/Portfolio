'use client';

import { useState, useEffect } from 'react';
import RocketScene from './components/RocketScene';

export default function Home() {
  const [showPopup, setShowPopup] = useState(true);

  // Hide popup after 8 seconds (increased from 5)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(false);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '30px 40px',
          borderRadius: '12px',
          zIndex: 1000,
          textAlign: 'center',
          minWidth: '400px',
          maxWidth: '90%',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)'
        }}>
          <button 
            onClick={() => setShowPopup(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            ✕
          </button>
          <h2 style={{ 
            fontSize: '24px', 
            margin: '0 0 15px 0',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>
            Welcome to the Portfolio
          </h2>
          <p style={{ 
            fontSize: '18px', 
            margin: '0',
            lineHeight: '1.5',
            fontWeight: '400',
            opacity: '0.9'
          }}>
            Choose a color first, and switch to first person to begin
          </p>
          <div style={{
            marginTop: '25px',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            opacity: '0.7'
          }}>
            Press ESC to use your mouse again at any time
          </div>
        </div>
      )}
      <RocketScene />
    </>
  );
}
