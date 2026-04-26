import React from 'react';
import successImg from '../assets/movie/end_success.png';
import failImg from '../assets/movie/end_fail.png';

const ResultScreen = ({ score, gameLog, onRestart }) => {
  const correctCount = gameLog.filter(log => log.isCorrect).length;
  const totalCount = gameLog.length;
  const percentage = Math.round((correctCount / totalCount) * 100) || 0;
  
  // 만점 기준: 각 영화당 최대 3점
  const maxScore = totalCount * 3;
  const isSuccess = score >= (maxScore / 2);

  return (
    <div className="text-center" style={{ width: '100%' }}>
      <img 
        src={isSuccess ? successImg : failImg} 
        alt={isSuccess ? "Success" : "Fail"} 
        style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
      />
      <h1 className="title" style={{ marginBottom: '0.5rem' }}>{isSuccess ? '축하합니다!' : '아쉽네요!'}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>최종 점수</p>
      
      <div className="final-score">{score}<span style={{fontSize: '2rem'}}>점</span></div>
      <div className="final-stats">
        {totalCount}개 중 {correctCount}개 정답 ({percentage}%)
      </div>

      <div className="log-list">
        {gameLog.map((log, index) => (
          <div key={index} className={`log-item ${log.isCorrect ? 'correct' : 'wrong'}`}>
            <div className="log-title">
              <span>{log.isCorrect ? '✅' : '❌'}</span>
              <span>{log.title}</span>
            </div>
            <div className="log-clues">
              {log.cluesUsed}개 단서 사용
            </div>
          </div>
        ))}
      </div>

      <button className="primary-btn" onClick={onRestart} style={{ width: '100%', justifyContent: 'center' }}>
        다시 하기 🔄
      </button>
    </div>
  );
};

export default ResultScreen;
