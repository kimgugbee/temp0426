import React from 'react';
import startVideo from '../assets/movie/start.mp4';

const IntroVideo = ({ onVideoEnd }) => {
  return (
    <div className="video-container" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'black', 
      zIndex: 9999,
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <video 
        src={startVideo} 
        autoPlay 
        playsInline 
        muted
        onEnded={onVideoEnd}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain' 
        }}
      />
      <button 
        className="skip-btn" 
        onClick={onVideoEnd} 
        style={{ 
          position: 'absolute', 
          bottom: '2rem', 
          right: '2rem', 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          color: 'white', 
          padding: '0.8rem 1.5rem', 
          borderRadius: '50px',
          border: '1px solid rgba(255,255,255,0.3)',
          width: 'auto',
          backdropFilter: 'blur(4px)'
        }}
      >
        건너뛰기 ⏭️
      </button>
    </div>
  );
};

export default IntroVideo;
