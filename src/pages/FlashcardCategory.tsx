import React from 'react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFlashcards } from '../context/FlashcardContext';
import { useAdmin } from '../context/AdminContext';
import { ArrowLeft, Play, Volume2, Type } from 'lucide-react';
import './Flashcards.css';

const FlashcardCategory: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { soundEnabled, spellEnabled, speakSpelling, setActiveCategoryForModelLoading } = useFlashcards();
  const { getCategoryById, getFlashcardsByCategory } = useAdmin();
  
  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const flashcards = categoryId ? getFlashcardsByCategory(categoryId) : [];

  // Set the active category for model loading when component mounts
  useEffect(() => {
    if (categoryId) {
      setActiveCategoryForModelLoading(categoryId);
    }
    
    // Cleanup when component unmounts
    return () => {
      setActiveCategoryForModelLoading(null);
    };
  }, [categoryId, setActiveCategoryForModelLoading]);
  if (!category) {
    return (
      <div className="flashcards-page">
        <div className="flashcards-header">
          <Link to="/flashcards" className="back-button">
            <ArrowLeft size={20} />
            Back to Categories
          </Link>
          <h1 className="flashcards-title">Category not found</h1>
        </div>
      </div>
    );
  }

  const handlePlaySound = (soundUrl: string, title: string) => {
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
            const utterance = new SpeechSynthesisUtterance(title);
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
          const utterance = new SpeechSynthesisUtterance(title);
          utterance.rate = 0.8;
          utterance.pitch = 1.1;
          utterance.volume = 0.8;
          speechSynthesis.speak(utterance);
        }
      });
      
      // Try to load the audio
      audio.load();
    } catch (error) {
      console.log('Audio creation failed, using text-to-speech fallback:', error);
      // Fallback to text-to-speech if audio creation fails
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(title);
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="flashcards-page responsive-container">
      <div className="flashcards-header">
        <Link to="/flashcards" className="back-button">
          <ArrowLeft size={20} />
          Back to Categories
        </Link>
        
        <h1 className="flashcards-title">
          {category.icon} {category.name}
        </h1>
        <p className="flashcards-subtitle">{category.description}</p>
      </div>

      <div className="flashcard-grid responsive-grid">
        {flashcards.map(flashcard => (
          <div
            key={flashcard.id}
            className="flashcard"
            style={{ '--category-color': category.color } as React.CSSProperties}
          >
            <Link to={`/flashcards/${categoryId}/${flashcard.id}`}>
              <img
                src={flashcard.imageUrl}
                alt={flashcard.title}
                className="flashcard-image"
                onError={(e) => {
                  // Fallback image if the original fails to load
                  e.currentTarget.src = 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400';
                }}
              />
            </Link>
            
            <h3 className="flashcard-title">{flashcard.title}</h3>
            
            {flashcard.description && (
              <p className="flashcard-description">{flashcard.description}</p>
            )}
            
            {flashcard.pronunciation && spellEnabled && (
              <div className="flashcard-pronunciation">
                /{flashcard.pronunciation}/
              </div>
            )}
            
            <div className="flashcard-audio-controls">
              <button
                className="audio-control-button"
                onClick={() => handlePlaySound(flashcard.soundUrl, flashcard.title)}
                disabled={!soundEnabled}
                style={{ '--category-color': category.color } as React.CSSProperties}
                title="Play word sound"
              >
                <Volume2 size={16} />
                Sound
              </button>
              
              <button
                className="audio-control-button spell-button"
                onClick={() => {
                  if (soundEnabled && spellEnabled) {
                    speakSpelling(flashcard.title);
                  }
                }}
                disabled={!soundEnabled}
                title="Spell out the word"
              >
                <Type size={16} />
                Spell
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashcardCategory;