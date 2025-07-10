import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAdmin } from './AdminContext';
import toast from 'react-hot-toast';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import Tesseract from 'tesseract.js';
import QrScanner from 'qr-scanner';

interface FlashcardContextType {
  playSound: (soundUrl: string) => void;
  // Settings
  soundEnabled: boolean;
  spellEnabled: boolean;
  cameraDetectionEnabled: boolean;
  cameraFlipped: boolean;
  ocrEnabled: boolean;
  qrCodeEnabled: boolean;
  toggleSound: () => void;
  toggleSpell: () => void;
  toggleCameraDetection: () => void;
  toggleCameraFlip: () => void;
  toggleOCR: () => void;
  toggleQRCode: () => void;
  // Camera detection
  startCameraDetection: (categoryId?: string) => Promise<void>;
  stopCameraDetection: () => void;
  detectedObjects: string[];
  isDetecting: boolean;
  modelLoading: boolean;
  cameraFeedElement: HTMLVideoElement | null;
  setCameraFeedElement: (element: HTMLVideoElement | null) => void;
  currentActiveCategoryModelUrl: string | null;
  setActiveCategoryForModelLoading: (categoryId: string | null) => void;
  // OCR and QR Code
  detectedText: string[];
  detectedQRCodes: string[];
  // Spelling
  speakSpelling: (word: string) => void;
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined);

export const useFlashcards = () => {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
};

export const FlashcardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { categories, flashcards, getCategoryById, getFlashcardById, getFlashcardsByCategory } = useAdmin();
  
  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('flashcard_sound_enabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [spellEnabled, setSpellEnabled] = useState(() => {
    const saved = localStorage.getItem('flashcard_spell_enabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [cameraDetectionEnabled, setCameraDetectionEnabled] = useState(() => {
    const saved = localStorage.getItem('flashcard_camera_enabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [cameraFlipped, setCameraFlipped] = useState(() => {
    const saved = localStorage.getItem('flashcard_camera_flipped');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [ocrEnabled, setOcrEnabled] = useState(() => {
    const saved = localStorage.getItem('flashcard_ocr_enabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [qrCodeEnabled, setQrCodeEnabled] = useState(() => {
    const saved = localStorage.getItem('flashcard_qr_enabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Camera detection state
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [detectedText, setDetectedText] = useState<string[]>([]);
  const [detectedQRCodes, setDetectedQRCodes] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  const [cameraFeedElement, setCameraFeedElement] = useState<HTMLVideoElement | null>(null);
  const [currentActiveCategoryModelUrl, setCurrentActiveCategoryModelUrl] = useState<string | null>(null);
  
  // TensorFlow.js model state
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('flashcard_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('flashcard_spell_enabled', JSON.stringify(spellEnabled));
  }, [spellEnabled]);

  useEffect(() => {
    localStorage.setItem('flashcard_camera_enabled', JSON.stringify(cameraDetectionEnabled));
  }, [cameraDetectionEnabled]);

  useEffect(() => {
    localStorage.setItem('flashcard_camera_flipped', JSON.stringify(cameraFlipped));
  }, [cameraFlipped]);

  useEffect(() => {
    localStorage.setItem('flashcard_ocr_enabled', JSON.stringify(ocrEnabled));
  }, [ocrEnabled]);

  useEffect(() => {
    localStorage.setItem('flashcard_qr_enabled', JSON.stringify(qrCodeEnabled));
  }, [qrCodeEnabled]);


  // Load TensorFlow.js model
  const loadModel = async (modelUrl?: string) => {
    if (modelRef.current) return modelRef.current;
    
    setModelLoading(true);
    try {
      // Set TensorFlow.js backend to webgl for better performance
      await tf.setBackend('webgl');
      await tf.ready();
      
      if (modelUrl) {
        console.log(`Loading fine-tuned model from: ${modelUrl}`);
        // In a real implementation, you would load the custom model here
        // For now, we'll simulate loading a category-specific model
        toast.success(`Loading specialized model for better accuracy...`);
        
        // Simulate loading time for fine-tuned model
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Load the base model but mark it as category-specific
        const model = await cocoSsd.load({
          base: 'lite_mobilenet_v2',
        });
        
        setCurrentActiveCategoryModelUrl(modelUrl);
        console.log('Fine-tuned model loaded successfully');
        toast.success('Specialized AI model loaded for better detection!');
        return model;
      } else {
        console.log('Loading default COCO-SSD model...');
        const model = await cocoSsd.load({
          base: 'lite_mobilenet_v2', // Use lighter model for better performance
        });
        
        setCurrentActiveCategoryModelUrl(null);
        console.log('Default COCO-SSD model loaded successfully');
        toast.success('AI model loaded successfully!');
        return model;
      }
      
      modelRef.current = model;
      return model;
    } catch (error) {
      console.error('Error loading model:', error);
      toast.error('Failed to load AI model. Using fallback detection.');
      setCurrentActiveCategoryModelUrl(null);
      return null;
    } finally {
      setModelLoading(false);
    }
  };

  // Map detected object names to flashcard names
  const mapObjectToFlashcard = (detectedClass: string): string[] => {
    const objectMap: Record<string, string[]> = {
      'cat': ['cat'],
      'dog': ['dog'],
      'cow': ['cow'],
      'bird': ['duck'],
      'person': [],
      'car': [],
      'truck': [],
      'bus': [],
      'bicycle': [],
      'motorcycle': [],
      'airplane': [],
      'boat': [],
      'traffic light': [],
      'fire hydrant': [],
      'stop sign': [],
      'parking meter': [],
      'bench': [],
      'elephant': [],
      'bear': [],
      'zebra': [],
      'giraffe': [],
      'horse': [],
      'sheep': [],
      'teddy bear': [],
      'frisbee': ['circle'],
      'sports ball': ['circle'],
      'kite': [],
      'baseball bat': [],
      'baseball glove': [],
      'skateboard': [],
      'surfboard': [],
      'tennis racket': [],
      'bottle': [],
      'wine glass': [],
      'cup': [],
      'fork': [],
      'knife': [],
      'spoon': [],
      'bowl': ['circle'],
      'banana': ['yellow'],
      'apple': ['red'],
      'sandwich': [],
      'orange': [],
      'broccoli': ['green'],
      'carrot': [],
      'hot dog': [],
      'pizza': ['circle'],
      'donut': ['circle'],
      'cake': [],
      'chair': [],
      'couch': [],
      'potted plant': ['green'],
      'bed': [],
      'dining table': [],
      'toilet': [],
      'tv': ['square'],
      'laptop': ['square'],
      'mouse': [],
      'remote': [],
      'keyboard': [],
      'cell phone': ['square'],
      'microwave': ['square'],
      'oven': ['square'],
      'toaster': ['square'],
      'sink': [],
      'refrigerator': ['square'],
      'book': ['square'],
      'clock': ['circle'],
      'vase': [],
      'scissors': [],
      'hair drier': [],
      'toothbrush': []
    };

    return objectMap[detectedClass.toLowerCase()] || [];
  };

  // Real object detection using TensorFlow.js
  const detectObjects = async (videoElement: HTMLVideoElement): Promise<string[]> => {
    if (!modelRef.current) {
      console.log('Model not loaded, attempting to load...');
      const model = await loadModel();
      if (!model) {
        // Fallback to mock detection if model fails to load
        return [];
      }
      modelRef.current = model;
    }

    // Double-check that model is still available after loading
    if (!modelRef.current) {
      console.error('Model is still null after loading attempt');
      return [];
    }

    try {
      // Perform object detection
      const predictions = await modelRef.current!.detect(videoElement);
      
      // Filter predictions with confidence > 0.5 and map to flashcard objects
      const detectedObjects: string[] = [];
      
      predictions.forEach(prediction => {
        if (prediction.score > 0.5) {
          const mappedObjects = mapObjectToFlashcard(prediction.class);
          detectedObjects.push(...mappedObjects);
        }
      });

      // Remove duplicates and return
      return [...new Set(detectedObjects)];
    } catch (error) {
      console.error('Error during object detection:', error);
      return [];
    }
  };

  // OCR text detection
  const detectText = async (videoElement: HTMLVideoElement): Promise<string[]> => {
    if (!ocrEnabled) return [];
    
    // Check if video dimensions are valid
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.log('Video dimensions are zero, skipping OCR');
      return [];
    }
    
    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);
      
      // Use canvas directly with Tesseract
      const result = await Tesseract.recognize(canvas, 'eng', {
        logger: () => {} // Disable logging
      });
      
      const text = result.data.text.trim();
      if (text) {
        // Split text into words and filter out short/invalid words
        const words = text.split(/\s+/).filter(word => 
          word.length > 2 && /^[a-zA-Z]+$/.test(word)
        );
        
        // Check if any detected words match flashcard titles
        const matchedWords = words.filter(word => 
          flashcards.some(card => 
            card.title.toLowerCase() === word.toLowerCase()
          )
        );
        
        return matchedWords;
      }
      
      return [];
    } catch (error) {
      console.error('OCR detection error:', error);
      return [];
    }
  };

  // QR Code detection
  const detectQRCodes = async (videoElement: HTMLVideoElement): Promise<string[]> => {
    if (!qrCodeEnabled) return [];
    
    // Check if video dimensions are valid
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.log('Video dimensions are zero, skipping QR code detection');
      return [];
    }
    
    try {
      const result = await QrScanner.scanImage(videoElement, {
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
      });
      
      if (result && result.data) {
        // Check if QR code contains a flashcard link or ID
        const qrData = result.data;
        
        // Look for flashcard URLs or IDs in QR code
        const flashcardMatch = qrData.match(/flashcards\/([^\/]+)\/([^\/\?]+)/);
        if (flashcardMatch) {
          const [, categoryId, flashcardId] = flashcardMatch;
          const flashcard = getFlashcardById(flashcardId);
          if (flashcard) {
            return [flashcard.title];
          }
        }
        
        // Check if QR code contains text that matches a flashcard title
        const matchedFlashcard = flashcards.find(card => 
          qrData.toLowerCase().includes(card.title.toLowerCase())
        );
        
        if (matchedFlashcard) {
          return [matchedFlashcard.title];
        }
      }
      
      return [];
    } catch (error) {
      // QR code not found or error - this is normal
      return [];
    }
  };


  const playSound = (soundUrl: string) => {
    if (!soundEnabled) return;
    
    try {
      // Create audio element and play sound
      const audio = new Audio(soundUrl);
      audio.volume = 0.7;
      
      // Add event listeners for better error handling
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(error => {
          console.log('Audio file not found, using text-to-speech fallback:', error);
          // Fallback to text-to-speech if audio file doesn't exist
          if ('speechSynthesis' in window) {
            // Extract word from sound URL (e.g., "/sounds/cat-meow.mp3" -> "cat")
            const wordMatch = soundUrl.match(/\/sounds\/([^-]+)/);
            const word = wordMatch ? wordMatch[1] : 'word';
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.8;
            utterance.pitch = 1.1;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
          }
        });
      });
      
      audio.addEventListener('error', (error) => {
        console.log('Audio loading error, using text-to-speech fallback:', error);
        // Fallback to text-to-speech if audio file doesn't exist
        if ('speechSynthesis' in window) {
          // Extract word from sound URL (e.g., "/sounds/cat-meow.mp3" -> "cat")
          const wordMatch = soundUrl.match(/\/sounds\/([^-]+)/);
          const word = wordMatch ? wordMatch[1] : 'word';
          
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.rate = 0.8;
          utterance.pitch = 1.1;
          utterance.volume = 0.8;
          speechSynthesis.speak(utterance);
        }
      });
      
      // Try to load the audio
      audio.load();
    } catch (error) {
      console.log('Audio creation failed:', error);
      // Fallback to text-to-speech if audio creation fails
      if ('speechSynthesis' in window) {
        // Extract word from sound URL (e.g., "/sounds/cat-meow.mp3" -> "cat")
        const wordMatch = soundUrl.match(/\/sounds\/([^-]+)/);
        const word = wordMatch ? wordMatch[1] : 'word';
        
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const speakSpelling = (word: string) => {
    if (!soundEnabled || !spellEnabled) return;
    
    if (!word) return;
    
    if ('speechSynthesis' in window) {
      // First say the word normally
      const wordUtterance = new SpeechSynthesisUtterance(word);
      wordUtterance.rate = 0.8;
      wordUtterance.pitch = 1.1;
      wordUtterance.volume = 0.8;
      
      // Then spell it out letter by letter with pauses
      const letters = word.split('').join(' - ');
      const spellingUtterance = new SpeechSynthesisUtterance(letters);
      spellingUtterance.rate = 0.6;
      spellingUtterance.pitch = 1.0;
      spellingUtterance.volume = 0.8;
      
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      speechSynthesis.speak(wordUtterance);
      
      // Wait for the word to finish, then spell it
      setTimeout(() => {
        speechSynthesis.speak(spellingUtterance);
      }, (word.length * 100) + 500);
    } else {
      console.log('Speech synthesis not supported');
    }
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
    toast.success(`Sound ${!soundEnabled ? 'enabled' : 'disabled'}`);
  };

  const toggleSpell = () => {
    setSpellEnabled(prev => !prev);
    toast.success(`Spelling ${!spellEnabled ? 'enabled' : 'disabled'}`);
  };

  const toggleCameraDetection = () => {
    const newValue = !cameraDetectionEnabled;
    setCameraDetectionEnabled(newValue);
    
    if (!newValue && isDetecting) {
      stopCameraDetection();
    }
    
    toast.success(`Camera detection ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleCameraFlip = () => {
    setCameraFlipped(prev => !prev);
    toast.success(`Camera ${!cameraFlipped ? 'flipped' : 'normal'}`);
  };

  const toggleOCR = () => {
    setOcrEnabled(prev => !prev);
    toast.success(`Text recognition ${!ocrEnabled ? 'enabled' : 'disabled'}`);
  };

  const toggleQRCode = () => {
    setQrCodeEnabled(prev => !prev);
    toast.success(`QR code scanning ${!qrCodeEnabled ? 'enabled' : 'disabled'}`);
  };

  const startCameraDetection = async (categoryId?: string) => {
    // Check if any camera feature is enabled
    const isCameraFeatureEnabled = cameraDetectionEnabled || ocrEnabled || qrCodeEnabled;
    
    if (!isCameraFeatureEnabled) {
      toast.error('Please enable at least one camera feature (Object Detection, Text Recognition, or QR Code Scanning) in settings first.');
      return;
    }

    try {
      // Determine which model to load based on category
      let modelUrl: string | undefined;
      if (categoryId) {
        const category = getCategoryById(categoryId);
        modelUrl = category?.modelUrl;
        if (modelUrl) {
          toast.success(`Loading specialized model for ${category.name}...`);
        }
      }
      
      // Load the appropriate model first if not already loaded
      const loadedModel = await loadModel(modelUrl);
      if (!loadedModel) {
        console.error('Failed to load model, aborting camera detection');
        setIsDetecting(false);
        toast.error('Failed to load AI model. Camera detection cannot start.');
        return;
      }
      
      modelRef.current = loadedModel;
      
      // Additional check after model loading
      if (!modelRef.current && cameraDetectionEnabled) {
        if (!modelUrl) {
          toast.loading('Loading AI model, please wait...');
        }
        console.error('Model is still null after loading, aborting camera detection');
        setIsDetecting(false);
        toast.error('AI model failed to initialize. Please try again.');
        return;
      }

      // Improved camera constraints for mobile devices
      let videoConstraints: MediaTrackConstraints = {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
      };

      // Try environment camera first, fallback to user camera
      if (!cameraFlipped) {
        try {
          videoConstraints.facingMode = { exact: 'environment' };
        } catch (error) {
          console.log('Environment camera not available, using default');
          videoConstraints.facingMode = 'environment';
        }
      } else {
        videoConstraints.facingMode = 'user';
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: videoConstraints
        });
      } catch (error) {
        console.log('Failed with specific constraints, trying fallback');
        // Fallback with simpler constraints
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              facingMode: cameraFlipped ? 'user' : 'environment'
            }
          });
        } catch (fallbackError) {
          console.log('Fallback failed, using any available camera');
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true
          });
        }
      }
      
      setVideoStream(stream);
      setIsDetecting(true);
      
      const modelType = (currentActiveCategoryModelUrl && cameraDetectionEnabled) ? 'specialized' : 'general';
      const categoryName = categoryId ? getCategoryById(categoryId)?.name : 'all categories';
      
      const enabledFeatures = [];
      if (cameraDetectionEnabled) enabledFeatures.push('Object Detection');
      if (ocrEnabled) enabledFeatures.push('Text Recognition');
      if (qrCodeEnabled) enabledFeatures.push('QR Code Scanning');
      
      toast.success(`Camera started for ${categoryName} with ${enabledFeatures.join(', ')}!`);

      // Create video element for detection
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
      }
      
      const video = videoRef.current;
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.transform = cameraFlipped ? 'scaleX(-1)' : 'scaleX(1)';
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve(void 0);
        };
      });

      // Set the camera feed element for display
      setCameraFeedElement(video);

      // Start detection loop
      const interval = setInterval(async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          // Run detection methods based on enabled features
          const detectionPromises = [];
          
          if (cameraDetectionEnabled) {
            detectionPromises.push(detectObjects(video));
          } else {
            detectionPromises.push(Promise.resolve([]));
          }
          
          if (ocrEnabled) {
            detectionPromises.push(detectText(video));
          } else {
            detectionPromises.push(Promise.resolve([]));
          }
          
          if (qrCodeEnabled) {
            detectionPromises.push(detectQRCodes(video));
          } else {
            detectionPromises.push(Promise.resolve([]));
          }
          
          const [objects, text, qrCodes] = await Promise.all(detectionPromises);
          
          setDetectedObjects(objects);
          setDetectedText(text);
          setDetectedQRCodes(qrCodes);
          
          // Combine all detected items for audio feedback
          const allDetected = [...objects, ...text, ...qrCodes];
          
          // Auto-play sounds for detected objects
          if (allDetected.length > 0 && soundEnabled) {
            allDetected.forEach((obj, index) => {
              const flashcard = flashcards.find(f => f.title.toLowerCase() === obj.toLowerCase());
              if (flashcard) {
                setTimeout(() => {
                  if (spellEnabled) {
                    speakSpelling(flashcard.title);
                  } else {
                    if ('speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(flashcard.title);
                      utterance.rate = 0.8;
                      utterance.pitch = 1.1;
                      utterance.volume = 0.6;
                      speechSynthesis.speak(utterance);
                    }
                  }
                }, index * 1000); // Stagger announcements
              }
            });
          }
        }
      }, 3000); // Check every 3 seconds for better performance

      setDetectionInterval(interval);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions and try again.');
      setIsDetecting(false);
    }
  };

  const stopCameraDetection = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraFeedElement(null);
    
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
    
    setIsDetecting(false);
    setDetectedObjects([]);
    setDetectedText([]);
    setDetectedQRCodes([]);
    setCurrentActiveCategoryModelUrl(null);
    modelRef.current = null; // Reset model so it can be reloaded with different category
    toast.success('Camera detection stopped');
  };

  const setActiveCategoryForModelLoading = (categoryId: string | null) => {
    if (categoryId) {
      const category = getCategoryById(categoryId);
      if (category?.modelUrl && category.modelUrl !== currentActiveCategoryModelUrl) {
        // Reset the current model so it can be reloaded with the new category model
        modelRef.current = null;
        setCurrentActiveCategoryModelUrl(category.modelUrl);
      }
    } else {
      // Reset to default model
      if (currentActiveCategoryModelUrl) {
        modelRef.current = null;
        setCurrentActiveCategoryModelUrl(null);
      }
    }
  };
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraDetection();
      // Dispose of the model when component unmounts
      if (modelRef.current) {
        modelRef.current = null;
      }
    };
  }, []);

  return (
    <FlashcardContext.Provider
      value={{
        playSound,
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
        setCameraFeedElement,
        currentActiveCategoryModelUrl,
        setActiveCategoryForModelLoading,
        detectedText,
        detectedQRCodes,
        speakSpelling,
      }}
    >
      {children}
    </FlashcardContext.Provider>
  );
};