import React from 'react';
import { useFlashcards } from '../context/FlashcardContext';
import { Volume2, VolumeX, Type, TypeIcon, Camera, CameraOff, FileText, QrCode } from 'lucide-react';

const FlashcardSettings: React.FC = () => {
  const { 
    soundEnabled,
    spellEnabled,
    cameraDetectionEnabled,
    ocrEnabled,
    qrCodeEnabled,
    toggleSound,
    toggleSpell,
    toggleCameraDetection,
    toggleOCR,
    toggleQRCode,
  } = useFlashcards();

  return (
    <div className="compact-settings-panel">
      <h2 className="compact-settings-title">Settings</h2>
      
      <div className="compact-settings-grid">
        <button 
          className={`compact-setting-button ${soundEnabled ? 'active' : ''}`}
          onClick={toggleSound}
          title="Toggle sound effects"
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>{window.innerWidth > 480 ? 'Sound' : ''}</span>
        </button>
        
        <button 
          className={`compact-setting-button ${spellEnabled ? 'active' : ''}`}
          onClick={toggleSpell}
          title="Toggle spelling pronunciation"
        >
          {spellEnabled ? <Type size={16} /> : <TypeIcon size={16} />}
          <span>{window.innerWidth > 480 ? 'Spelling' : ''}</span>
        </button>
        
        <button 
          className={`compact-setting-button ${cameraDetectionEnabled ? 'active' : ''}`}
          onClick={toggleCameraDetection}
          title="Toggle object detection"
        >
          {cameraDetectionEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
          <span>{window.innerWidth > 480 ? 'Objects' : ''}</span>
        </button>
        
        <button 
          className={`compact-setting-button ${ocrEnabled ? 'active' : ''}`}
          onClick={toggleOCR}
          title="Toggle text recognition"
        >
          <FileText size={16} />
          <span>{window.innerWidth > 480 ? 'Text' : ''}</span>
        </button>
        
        <button 
          className={`compact-setting-button ${qrCodeEnabled ? 'active' : ''}`}
          onClick={toggleQRCode}
          title="Toggle QR code scanning"
        >
          <QrCode size={16} />
          <span>{window.innerWidth > 480 ? 'QR Code' : ''}</span>
        </button>
      </div>
    </div>
  );
};

export default FlashcardSettings;