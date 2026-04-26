import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import IntroVideo from './components/IntroVideo';
import Quiz from './components/Quiz';
import ResultScreen from './components/ResultScreen';
import { movies } from './data/movies';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('start'); // 'start', 'intro', 'quiz', 'result'
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameLog, setGameLog] = useState([]);

  const handleStart = () => {
    setGameState('intro');
    setCurrentMovieIndex(0);
    setScore(0);
    setGameLog([]);
  };

  const handleVideoEnd = () => {
    setGameState('quiz');
  };

  const handleLog = (logEntry) => {
    setGameLog((prev) => [...prev, logEntry]);
  };

  const handleNextMovie = (pointsEarned) => {
    setScore((prev) => prev + pointsEarned);

    if (currentMovieIndex < movies.length - 1) {
      setCurrentMovieIndex((prev) => prev + 1);
    } else {
      setGameState('result');
    }
  };

  const handleRestart = () => {
    setGameState('start');
  };

  return (
    <div className="app-container">
      {gameState === 'start' && <StartScreen onStart={handleStart} />}
      
      {gameState === 'intro' && <IntroVideo onVideoEnd={handleVideoEnd} />}

      {gameState === 'quiz' && (
        <Quiz 
          movie={movies[currentMovieIndex]} 
          currentIndex={currentMovieIndex}
          totalCount={movies.length}
          currentScore={score}
          onNext={handleNextMovie}
          onLog={handleLog}
        />
      )}
      
      {gameState === 'result' && (
        <ResultScreen 
          score={score} 
          gameLog={gameLog}
          onRestart={handleRestart} 
        />
      )}
    </div>
  );
}

export default App;
