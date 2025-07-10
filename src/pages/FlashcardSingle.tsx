import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useFlashcards } from '../context/FlashcardContext';
import { useAdmin } from '../context/AdminContext';
import { ArrowLeft, SkipForward, SkipBack, Grid, Volume2, Type } from 'lucide-react';
import Layout from '../components/layout/Layout';
import './Flashcards.css';

const FlashcardSingle: React.FC = () => {
  const { categoryId, flashcardId } = useParams<{ categoryId: string; flashcardId: string }>();
  const navigate = useNavigate();
  const { soundEnabled, spellEnabled, speakSpelling, setActiveCategoryForModelLoading } = useFlashcards();
  const { getCategoryById, getFlashcardById, getFlashcardsByCategory } = useAdmin();
  
  const category = categoryId ? getCategoryById(categoryId) : undefined;
  const flashcard = flashcardId ? getFlashcardById(flashcardId) : undefined;
  const allFlashcards = categoryId ? getFlashcardsByCategory(categoryId) : [];
  
  const currentIndex = allFlashcards.findIndex(card => card.id === flashcardId);
  const nextCard = allFlashcards[currentIndex + 1];
  const prevCard = allFlashcards[currentIndex - 1];

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

  // Auto-play sound when flashcard loads
  useEffect(() => {
    if (flashcard && soundEnabled) {
      const timer = setTimeout(() => {
        handlePlaySound();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [flashcard]);

  if (!category || !flashcard) {
    return (
      <Layout>
        <div className="flashcards-page">
          <div className="flashcards-header">
            <Link to="/dashboard" className="back-button">
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className="flashcards-title">Flashcard not found</h1>
          </div>
        </div>
      </Layout>
    );
  }

  const handlePlaySound = () => {
    if (!soundEnabled) return;
    
    try {
      // Create audio element and play sound
      const audio = new Audio(flashcard.soundUrl);
      audio.volume = 0.7;
      
      // Add event listeners for better error handling
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(error => {
          console.log('Audio file not found, using text-to-speech fallback:', error);
          // Fallback to text-to-speech if audio file doesn't exist
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(flashcard.title);
            utterance.rate = 0.7;
            utterance.pitch = 1.2;
            utterance.volume = 0.9;
            speechSynthesis.speak(utterance);
          }
        });
      });
      
      audio.addEventListener('error', (error) => {
        console.log('Audio loading error, using text-to-speech fallback:', error);
        // Fallback to text-to-speech if audio file doesn't exist
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(flashcard.title);
          utterance.rate = 0.7;
          utterance.pitch = 1.2;
          utterance.volume = 0.9;
          speechSynthesis.speak(utterance);
        }
      });
      
      // Try to load the audio
      audio.load();
    } catch (error) {
      console.log('Audio creation failed, using text-to-speech fallback:', error);
      // Fallback to text-to-speech if audio creation fails
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(flashcard.title);
        utterance.rate = 0.7;
        utterance.pitch = 1.2;
        utterance.volume = 0.9;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const handleNext = () => {
    if (nextCard) {
      navigate(`/flashcards/${categoryId}/${nextCard.id}`);
    }
  };

  const handlePrevious = () => {
    if (prevCard) {
      navigate(`/flashcards/${categoryId}/${prevCard.id}`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && nextCard) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && prevCard) {
        handlePrevious();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handlePlaySound();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextCard, prevCard]);

  return (
    <Layout>
      <div className="flashcards-page responsive-container">
        <div className="flashcards-header">
          <Link to={`/flashcards/${categoryId}`} className="back-button">
            <ArrowLeft size={20} />
            Back to {category.name}
          </Link>
          
          <h1 className="flashcards-title">
            {category.icon} {category.name}
          </h1>
          <p className="flashcards-subtitle">
            Card {currentIndex + 1} of {allFlashcards.length}
          </p>
        </div>

        <div 
          className="single-flashcard-container responsive-single-card"
          style={{ '--category-color': category.color } as React.CSSProperties}
        >
          <img
            src={flashcard.imageUrl}
            alt={flashcard.title}
            className="single-flashcard-image"
            onError={(e) => {
              e.currentTarget.src = 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=400';
            }}
          />
          
          <h2 className="single-flashcard-title">{flashcard.title}</h2>
          
          {flashcard.description && (
            <p className="single-flashcard-description">{flashcard.description}</p>
          )}
          
          {flashcard.pronunciation && spellEnabled && (
            <div className="single-flashcard-pronunciation">
              /{flashcard.pronunciation}/
            </div>
          )}
          
          <div className="compact-single-audio-controls">
            <button
              className="compact-single-audio-button"
              onClick={handlePlaySound}
              disabled={!soundEnabled}
              style={{ '--category-color': category.color } as React.CSSProperties}
              title="Play word sound"
            >
              <Volume2 size={18} />
              Sound
            </button>
            
            <button
              className="compact-single-audio-button spell-button"
              onClick={() => {
                if (flashcard && soundEnabled && spellEnabled) {
                  speakSpelling(flashcard.title);
                }
              }}
              disabled={!soundEnabled}
              style={{ '--category-color': category.color } as React.CSSProperties}
              title="Spell out the word"
            >
              <Type size={18} />
              Spell
            </button>
          </div>
          
          <div className="navigation-buttons">
            {prevCard && (
              <button
                className="nav-button"
                onClick={handlePrevious}
                style={{ '--category-color': category.color } as React.CSSProperties}
              >
                <SkipBack size={18} />
                Previous
              </button>
            )}
            
            <Link
              to={`/flashcards/${categoryId}`}
              className="nav-button"
              style={{ '--category-color': category.color } as React.CSSProperties}
            >
              <Grid size={18} />
              View All
            </Link>
            
            {nextCard && (
              <button
                className="nav-button"
                onClick={handleNext}
                style={{ '--category-color': category.color } as React.CSSProperties}
              >
                Next
                <SkipForward size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FlashcardSingle;