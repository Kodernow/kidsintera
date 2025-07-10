import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFlashcards } from '../context/FlashcardContext';
import { useAdmin } from '../context/AdminContext';
import { ArrowLeft, Play, Settings, Volume2, VolumeX, Type, TypeIcon, Camera, CameraOff, Eye, EyeOff, Video, RotateCcw, FileText, QrCode, Grid, Target } from 'lucide-react';
import FlashcardSettings from '../components/FlashcardSettings';
import './Flashcards.css';

type ViewMode = 'manual' | 'camera';

interface FlashcardsProps {
  isEmbeddedInDashboard?: boolean;
}

const Flashcards: React.FC<FlashcardsProps> = ({ isEmbeddedInDashboard = false }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('manual');
  const [selectedCategoryForCamera, setSelectedCategoryForCamera] = useState<string>('');
  const [lastUsedCategory, setLastUsedCategory] = useState<string>('');
  const [detectedFlashcard, setDetectedFlashcard] = useState<any>(null);
  
  const { 
    soundEnabled,
    spellEnabled,
    cameraDetectionEnabled,
    cameraFlipped,
    ocrEnabled,
    qrCodeEnabled,
    toggleSound,
    toggleSpell,
    toggleCameraDetection,
    toggleCameraFlip,
    toggleOCR,
    toggleQRCode,
    startCameraDetection,
    stopCameraDetection,
    detectedObjects,
    isDetecting,
    modelLoading,
    cameraFeedElement,
    detectedText,
    detectedQRCodes,
    currentActiveCategoryModelUrl,
    speakSpelling
  } = useFlashcards();
  
  const { categories, getFlashcardsByCategory, getFlashcardById } = useAdmin();
  const navigate = useNavigate();

  // Handle detection results and show flashcard
  React.useEffect(() => {
    if (viewMode === 'camera' && (detectedObjects.length > 0 || detectedText.length > 0 || detectedQRCodes.length > 0)) {
      const allDetected = [...detectedObjects, ...detectedText, ...detectedQRCodes];
      
      // Find the first matching flashcard
      for (const detectedItem of allDetected) {
        // Use selected category or last used category for filtering
        const categoryToSearch = selectedCategoryForCamera || lastUsedCategory;
        let flashcard;
        
        if (categoryToSearch) {
          // Search within specific category
          const categoryFlashcards = getFlashcardsByCategory(categoryToSearch);
          flashcard = categoryFlashcards.find(f => f.title.toLowerCase() === detectedItem.toLowerCase());
        } else {
          // Search all flashcards
          flashcard = categories.flatMap(cat => getFlashcardsByCategory(cat.id))
            .find(f => f.title.toLowerCase() === detectedItem.toLowerCase());
        }
        
        if (flashcard) {
          setDetectedFlashcard(flashcard);
          // Update last used category
          setLastUsedCategory(flashcard.categoryId);
          break;
        }
      }
    }
  }, [detectedObjects, detectedText, detectedQRCodes, viewMode, selectedCategoryForCamera, lastUsedCategory]);

  const handleStartCameraDetection = async () => {
    const categoryId = selectedCategoryForCamera || lastUsedCategory;
    await startCameraDetection(categoryId);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryForCamera(categoryId);
    if (isDetecting) {
      // Restart detection with new category
      stopCameraDetection();
      setTimeout(() => {
        startCameraDetection(categoryId);
      }, 1000);
    }
  };

  const handlePlayDetectedSound = () => {
    if (!detectedFlashcard || !soundEnabled) return;
    
    try {
      const audio = new Audio(detectedFlashcard.soundUrl);
      audio.volume = 0.7;
      
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(error => {
          console.log('Audio file not found, using text-to-speech fallback:', error);
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(detectedFlashcard.title);
            utterance.rate = 0.8;
            utterance.pitch = 1.1;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
          }
        });
      });
      
      audio.addEventListener('error', (error) => {
        console.log('Audio loading error, using text-to-speech fallback:', error);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(detectedFlashcard.title);
          utterance.rate = 0.8;
          utterance.pitch = 1.1;
          utterance.volume = 0.8;
          speechSynthesis.speak(utterance);
        }
      });
      
      audio.load();
    } catch (error) {
      console.log('Audio creation failed, using text-to-speech fallback:', error);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(detectedFlashcard.title);
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const handleViewFlashcard = () => {
    if (detectedFlashcard) {
      navigate(`/flashcards/${detectedFlashcard.categoryId}/${detectedFlashcard.id}`);
    }
  };

  // Check if any camera-related feature is enabled
  const isCameraFeatureEnabled = cameraDetectionEnabled || ocrEnabled || qrCodeEnabled;

  return (
    <div className="flashcards-page">
      {!isEmbeddedInDashboard && (
        <div className="flashcards-header">
          <Link to="/dashboard" className="back-button">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          
          <h1 className="flashcards-title">🌟 Learning Flashcards 🌟</h1>
          <p className="flashcards-subtitle">
            Choose your learning mode: browse categories manually or use AI camera detection!
          </p>
        </div>
      )}

      {/* Mode Selection */}
      <div className="mode-selection">
        <h2 className="mode-title">Choose Learning Mode</h2>
        <div className="mode-buttons">
          <button
            className={`mode-button ${viewMode === 'manual' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('manual');
              if (isDetecting) stopCameraDetection();
              setDetectedFlashcard(null);
            }}
          >
            <Grid size={20} />
            <span>Manual Mode</span>
            <p>Browse categories and cards manually</p>
          </button>
          
          <button
            className={`mode-button ${viewMode === 'camera' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('camera');
              setDetectedFlashcard(null);
            }}
          >
            <Camera size={20} />
            <span>Camera Mode</span>
            <p>Use AI to detect objects and show cards</p>
          </button>
        </div>
      </div>

      {viewMode === 'manual' && (
        <>
          <FlashcardSettings viewMode="manual" />

          <div className="categories-grid responsive-categories-grid">
            {categories.map(category => {
              const flashcardCount = getFlashcardsByCategory(category.id).length;
              
              return (
                <Link
                  key={category.id}
                  to={`/flashcards/${category.id}`}
                  className="category-card responsive-category-card"
                  style={{ '--category-color': category.color } as React.CSSProperties}
                >
                  <span className="category-icon">{category.icon}</span>
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.description}</p>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {viewMode === 'camera' && (
        <div className="camera-mode-container">
          <div className="camera-settings-panel">
            <h2 className="settings-title">
              <Camera size={24} />
              Camera Detection Settings
            </h2>
            
            <div className="camera-category-selection">
              <label htmlFor="cameraCategory">Select Category (Optional)</label>
              <select
                id="cameraCategory"
                value={selectedCategoryForCamera}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="category-select"
              >
                <option value="">All Categories {lastUsedCategory && `(Last: ${categories.find(c => c.id === lastUsedCategory)?.name})`}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                    {category.modelUrl ? ' (Custom AI Model)' : ''}
                  </option>
                ))}
              </select>
              <div className="category-help">
                Select a category to use specialized AI models for better detection accuracy.
                If no category is selected, it will use the last used category or search all categories.
              </div>
            </div>
            
            <FlashcardSettings viewMode="camera" />
            
            {isCameraFeatureEnabled && (
              <div className="camera-section">
                <div className="camera-controls">
                  {!isDetecting ? (
                    <>
                      <button 
                        className="camera-button"
                        onClick={handleStartCameraDetection}
                        disabled={modelLoading}
                      >
                        <Camera size={20} />
                        {modelLoading ? 'Loading AI Model...' : 'Start Camera Detection'}
                      </button>
                      
                      <button 
                        className="camera-flip-button"
                        onClick={toggleCameraFlip}
                        title={`Switch to ${cameraFlipped ? 'back' : 'front'} camera`}
                      >
                        <RotateCcw size={16} />
                        {cameraFlipped ? 'Front Cam' : 'Back Cam'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="camera-button stop"
                        onClick={() => {
                          stopCameraDetection();
                          setDetectedFlashcard(null);
                        }}
                      >
                        <CameraOff size={20} />
                        Stop Detection
                      </button>
                      
                      <button 
                        className="camera-flip-button"
                        onClick={() => {
                          // Stop current detection, flip camera, then restart
                          stopCameraDetection();
                          toggleCameraFlip();
                          setTimeout(() => {
                            const categoryId = selectedCategoryForCamera || lastUsedCategory;
                            startCameraDetection(categoryId);
                          }, 1000);
                        }}
                        title={`Switch to ${cameraFlipped ? 'back' : 'front'} camera`}
                      >
                        <RotateCcw size={16} />
                        {cameraFlipped ? 'Front Cam' : 'Back Cam'}
                      </button>
                    </>
                  )}
                  
                  <div className={`detection-status ${isDetecting ? 'detecting' : ''}`}>
                    <Eye size={16} />
                    {modelLoading ? 'Loading AI model...' : 
                     isDetecting ? 'AI is analyzing camera feed...' : 'Detection ready'}
                  </div>
                </div>
                
                {(detectedObjects.length > 0 || detectedText.length > 0 || detectedQRCodes.length > 0) && (
                  <div className="detected-objects">
                    <h4>Detection Results:</h4>
                    <div className="detection-results">
                      {detectedObjects.length > 0 && (
                        <div className="detection-category">
                          <h5><Eye size={14} /> Objects:</h5>
                          <div className="objects-list">
                            {detectedObjects.map((obj, index) => (
                              <span key={index} className="object-tag">
                                {obj}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {detectedText.length > 0 && (
                        <div className="detection-category">
                          <h5><FileText size={14} /> Text:</h5>
                          <div className="objects-list">
                            {detectedText.map((text, index) => (
                              <span key={index} className="text-tag">
                                {text}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {detectedQRCodes.length > 0 && (
                        <div className="detection-category">
                          <h5><QrCode size={14} /> QR Codes:</h5>
                          <div className="objects-list">
                            {detectedQRCodes.map((qr, index) => (
                              <span key={index} className="qr-tag">
                                {qr}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="camera-layout">
                  {isDetecting && cameraFeedElement && (
                    <div className="camera-feed-container">
                      <h4 className="camera-feed-title">
                        <Video size={20} />
                        Camera Feed
                        <span className="live-indicator">
                          <span className="live-dot"></span>
                          LIVE
                        </span>
                      </h4>
                      <video
                        ref={(videoElement) => {
                          if (videoElement && cameraFeedElement) {
                            videoElement.srcObject = cameraFeedElement.srcObject;
                            videoElement.play();
                          }
                        }}
                        className="camera-feed"
                        autoPlay
                        muted
                        playsInline
                        style={{ transform: cameraFlipped ? 'scaleX(-1)' : 'scaleX(1)' }}
                      />
                    </div>
                  )}
                  
                  {detectedFlashcard && (
                    <div className="detected-flashcard-container">
                      <h4 className="detected-title">
                        <Target size={20} />
                        Detected Flashcard
                      </h4>
                      <div 
                        className="detected-flashcard"
                        style={{ '--category-color': categories.find(c => c.id === detectedFlashcard.categoryId)?.color } as React.CSSProperties}
                      >
                        <img
                          src={detectedFlashcard.imageUrl}
                          alt={detectedFlashcard.title}
                          className="detected-flashcard-image"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400';
                          }}
                        />
                        
                        <div className="detected-flashcard-content">
                          <h3 className="detected-flashcard-title">{detectedFlashcard.title}</h3>
                          
                          {detectedFlashcard.description && (
                            <p className="detected-flashcard-description">{detectedFlashcard.description}</p>
                          )}
                          
                          {detectedFlashcard.pronunciation && spellEnabled && (
                            <div className="detected-flashcard-pronunciation">
                              /{detectedFlashcard.pronunciation}/
                            </div>
                          )}
                          
                          <div className="detected-flashcard-actions">
                            <button
                              className="detected-action-button sound-button"
                              onClick={handlePlayDetectedSound}
                              disabled={!soundEnabled}
                              title="Play word sound"
                            >
                              <Volume2 size={16} />
                              Sound
                            </button>
                            
                            <button
                              className="detected-action-button spell-button"
                              onClick={() => {
                                if (detectedFlashcard && soundEnabled && spellEnabled) {
                                  speakSpelling(detectedFlashcard.title);
                                }
                              }}
                              disabled={!soundEnabled}
                              title="Spell out the word"
                            >
                              <Type size={16} />
                              Spell
                            </button>
                            
                            <button
                              className="detected-action-button view-button"
                              onClick={handleViewFlashcard}
                              title="View full flashcard"
                            >
                              <Eye size={16} />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;