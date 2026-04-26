import React from 'react';

const StartScreen = ({ onStart }) => {
  return (
    <div className="text-center" style={{ width: '100%' }}>
      <div className="icon-large">🎬</div>
      <h1 className="title">영화 맞추기 게임</h1>
      <p className="subtitle">단서를 보고 영화 제목을 맞혀보세요!</p>
      
      <div className="glass-card">
        <ul className="rules-list">
          <li>🔍 단서는 최대 <span className="highlight">3개</span>까지 공개됩니다</li>
          <li>✅ 단서가 적을수록 <span className="highlight-green">높은 점수</span>를 받습니다</li>
          <li>❌ <span className="highlight-red">3번</span> 틀리면 실패입니다</li>
          <li>⏭️ 모르면 건너뛸 수 있습니다</li>
          <li>🎯 총 <span className="highlight-purple">10개</span>의 영화가 준비되어 있습니다</li>
        </ul>
      </div>

      <button className="primary-btn" onClick={onStart}>
        게임 시작! 🎮
      </button>
    </div>
  );
};

export default StartScreen;
