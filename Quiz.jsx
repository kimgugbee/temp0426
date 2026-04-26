import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { movies as allMovies } from '../data/movies';

const Quiz = ({ movie, currentIndex, totalCount, currentScore, onNext, onLog }) => {
  const [cluesRevealed, setCluesRevealed] = useState(1);
  const [choices, setChoices] = useState([]);
  const [strikes, setStrikes] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);

  const webcamRef = useRef(null);
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [detectedNumber, setDetectedNumber] = useState(null);
  const [isOkSign, setIsOkSign] = useState(false);

  const lastVideoTimeRef = useRef(-1);
  const requestRef = useRef(null);
  const choiceSelectTriggeredRef = useRef(false);
  const holdingNumberRef = useRef(0);
  const holdingStartTimeRef = useRef(0);

  // Reset state when movie changes
  useEffect(() => {
    setCluesRevealed(1);
    setStrikes(0);
    setIsCorrect(false);
    setPointsEarned(0);
    setDetectedNumber(null);
    setIsOkSign(false);
    setTimeLeft(20);
    choiceSelectTriggeredRef.current = false;

    const others = allMovies.filter(m => m.id !== movie.id);
    const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 3);
    const newChoices = [...shuffledOthers, movie].sort(() => 0.5 - Math.random());
    setChoices(newChoices);
  }, [movie]);

  // TTS Effect
  useEffect(() => {
    if (movie && movie.clues && cluesRevealed > 0 && !isCorrect) {
      const currentClue = movie.clues[cluesRevealed - 1];
      if (currentClue && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = currentClue.value.replace(/"/g, '');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 1.1; // 약간 빠르게
        window.speechSynthesis.speak(utterance);
      }
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [movie, cluesRevealed, isCorrect]);

  useEffect(() => {
    let isMounted = true;
    const initializeHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        if (isMounted) {
          setHandLandmarker(landmarker);
        }
      } catch (err) {
        console.error("Failed to initialize hand landmarker:", err);
      }
    };
    initializeHandLandmarker();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (isCorrect || choiceSelectTriggeredRef.current) return;

    if (timeLeft <= 0) {
      onLog({
        title: movie.title,
        isCorrect: false,
        cluesUsed: cluesRevealed,
        timeout: true
      });
      onNext(0);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isCorrect, movie.title, cluesRevealed, onLog, onNext]);

  const handleChoiceSelect = useCallback((selectedTitle) => {
    if (selectedTitle === movie.title) {
      const points = 4 - cluesRevealed;
      setPointsEarned(points);
      setIsCorrect(true);
      onLog({
        title: movie.title,
        isCorrect: true,
        cluesUsed: cluesRevealed
      });
    } else {
      const newStrikes = strikes + 1;
      setStrikes(newStrikes);
      setDetectedNumber(null);
      setIsOkSign(false);
      choiceSelectTriggeredRef.current = false;

      if (newStrikes >= 3) {
        onLog({
          title: movie.title,
          isCorrect: false,
          cluesUsed: cluesRevealed
        });
        onNext(0);
      }
    }
  }, [movie, cluesRevealed, strikes, onLog, onNext]);

  useEffect(() => {
    if (isOkSign && detectedNumber && detectedNumber >= 1 && detectedNumber <= 4 && !choiceSelectTriggeredRef.current && choices.length > 0) {
      choiceSelectTriggeredRef.current = true;
      const selectedTitle = choices[detectedNumber - 1].title;
      setTimeout(() => {
        handleChoiceSelect(selectedTitle);
      }, 300); // 1.0초 딜레이로 OK 피드백 확인 후 넘어감
    }
  }, [isOkSign, detectedNumber, choices, handleChoiceSelect]);

  const detectGesture = useCallback(() => {
    if (!handLandmarker || !webcamRef.current || !webcamRef.current.video || isCorrect || choiceSelectTriggeredRef.current) {
      requestRef.current = requestAnimationFrame(detectGesture);
      return;
    }

    const video = webcamRef.current.video;
    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const results = handLandmarker.detectForVideo(video, performance.now());

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];

        const getDist2D = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        const wrist = landmarks[0];

        // 손가락이 펴져 있는지 판별: 끝마디(tip)가 중간마디(PIP)보다 손목에서 더 멀리 떨어져 있으면 펴진 것으로 간주
        const isIndexExtended = getDist2D(landmarks[8], wrist) > getDist2D(landmarks[6], wrist);
        const isMiddleExtended = getDist2D(landmarks[12], wrist) > getDist2D(landmarks[10], wrist);
        const isRingExtended = getDist2D(landmarks[16], wrist) > getDist2D(landmarks[14], wrist);
        const isPinkyExtended = getDist2D(landmarks[20], wrist) > getDist2D(landmarks[18], wrist);

        // 엄지와 검지 끝의 거리
        const distThumbIndex = getDist2D(landmarks[4], landmarks[8]);

        // 손 크기 대비 임계값 (검지 밑동과 새끼 밑동의 거리)
        const handSize = getDist2D(landmarks[5], landmarks[17]);
        const okSignThreshold = handSize * 0.6; // 손바닥 너비의 60% 이내로 가까워지면 OK

        const okSign = distThumbIndex < okSignThreshold && isMiddleExtended && isRingExtended && isPinkyExtended;

        let number = 0;
        if (!okSign) {
          if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) number = 1;
          else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) number = 2;
          else if (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) number = 3;
          else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) number = 4;
        }

        if (okSign) {
          setIsOkSign(true);
          holdingNumberRef.current = 0;
        } else {
          setIsOkSign(false);
          if (number > 0) {
            if (holdingNumberRef.current !== number) {
              holdingNumberRef.current = number;
              holdingStartTimeRef.current = performance.now();
            } else if (performance.now() - holdingStartTimeRef.current >= 1000) {
              setDetectedNumber(number);
            }
          } else {
            holdingNumberRef.current = 0;
          }
        }
      } else {
        setIsOkSign(false);
        holdingNumberRef.current = 0;
      }
    }
    requestRef.current = requestAnimationFrame(detectGesture);
  }, [handLandmarker, isCorrect]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(detectGesture);
    return () => cancelAnimationFrame(requestRef.current);
  }, [detectGesture]);

  const handleRevealClue = () => {
    if (cluesRevealed < 3) {
      setCluesRevealed((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onLog({
      title: movie.title,
      isCorrect: false,
      cluesUsed: cluesRevealed
    });
    onNext(0); // 0 points
  };

  if (isCorrect) {
    return (
      <div style={{ width: '100%' }}>
        <div className="header-row">
          <span>{currentIndex + 1} / {totalCount}</span>
          <span className="score-display">⭐ {currentScore}점</span>
        </div>

        <div className="correct-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 className="correct-title">정답입니다!</h2>

          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{ width: '200px', height: 'auto', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', objectFit: 'contain' }}
            />
          )}

          <div className="correct-movie">{movie.title}</div>
          <div className="correct-eng">{movie.englishTitle} ({movie.year})</div>
          <div className="score-earned">+{pointsEarned}점 획득!</div>
          <button className="next-movie-btn" onClick={() => onNext(pointsEarned)}>
            다음 영화 →
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = (timeLeft / 20) * 100;

  return (
    <div style={{ width: '100%' }}>
      {/* Progress Bar */}
      <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{
          width: `${progressPercentage}%`,
          height: '100%',
          backgroundColor: timeLeft <= 5 ? 'var(--danger)' : 'var(--primary-color)',
          transition: 'width 1s linear, background-color 0.3s'
        }} />
      </div>

      <div className="header-row">
        <span>{currentIndex + 1} / {totalCount}</span>
        <span className="score-display">
          <span style={{ color: timeLeft <= 5 ? 'var(--danger)' : 'white', marginRight: '10px' }}>⏳ {timeLeft}초</span>
          ⭐ {currentScore}점
        </span>
      </div>

      <div className="glass-card">
        <div className="clue-header">
          <div className="clue-title">🔍 단서</div>
          <div className="clue-dots">
            {[1, 2, 3].map((num) => (
              <div key={num} className={`clue-dot ${num <= cluesRevealed ? 'active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="clues-container">
          {movie.clues.slice(0, cluesRevealed).map((clue, index) => (
            <div key={index} className="clue-item">
              <div className="clue-label">{clue.label}</div>
              <div className="clue-value">{clue.value}</div>
            </div>
          ))}
        </div>

        {cluesRevealed < 3 && (
          <button className="next-clue-btn" onClick={handleRevealClue}>
            다음 명대사 보기 👁️ ({3 - cluesRevealed}개 남음)
          </button>
        )}
      </div>

      <div className="strikes-container">
        {[1, 2, 3].map((num) => (
          <span key={num} className={`strike ${num <= strikes ? 'active' : ''}`}>❌</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem', width: '100%' }}>
        {choices.map((choice, idx) => {
          const isSelected = detectedNumber === idx + 1;
          const isOk = isSelected && isOkSign;
          return (
            <button
              key={idx}
              className="next-clue-btn"
              style={{
                margin: 0,
                padding: '1.2rem',
                fontWeight: 'bold',
                border: '1px solid',
                borderColor: isSelected ? (isOk ? 'var(--success)' : 'var(--primary-color)') : 'rgba(255,255,255,0.2)',
                backgroundColor: isSelected ? (isOk ? 'rgba(16, 185, 129, 0.3)' : 'rgba(157, 0, 255, 0.3)') : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                transition: 'all 0.2s',
                transform: isOk ? 'scale(1.05)' : (isSelected ? 'scale(1.02)' : 'scale(1)')
              }}
              onClick={() => handleChoiceSelect(choice.title)}
            >
              {idx + 1}. {choice.title}
            </button>
          );
        })}
      </div>

      <button className="skip-btn" onClick={handleSkip}>
        모르겠어요, 건너뛰기 ⏭️
      </button>

      {/* Webcam PIP */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '160px',
        height: '120px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 1000,
        backgroundColor: '#000'
      }}>
        <Webcam
          ref={webcamRef}
          videoConstraints={{ facingMode: "user" }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isOkSign ? 'rgba(16, 185, 129, 0.4)' : 'transparent',
          pointerEvents: 'none',
          transition: 'background-color 0.2s'
        }}>
          {isOkSign ? (
            <span style={{ fontSize: '3rem' }}>👌</span>
          ) : detectedNumber ? (
            <span style={{ fontSize: '4rem', fontWeight: '900', color: '#fff', textShadow: '0px 0px 10px var(--primary-color)' }}>
              {detectedNumber}
            </span>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
              손가락으로<br />1~4 번호를<br />만들어보세요
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
