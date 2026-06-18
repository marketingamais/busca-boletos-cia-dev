import { AbsoluteFill, interpolate, useCurrentFrame, spring } from "remotion";
import "./system-styles.css";

export const LoadingGameAnimation = () => {
  const frame = useCurrentFrame();

  // Intro scale animation
  const scale = spring({
    frame,
    fps: 30,
    config: { damping: 15, stiffness: 100 },
  });

  // Game progress logic based on frames
  // Activity 1: 30 to 120, Activity 2: 120 to 240, Activity 3: 240+
  const progressWidth = interpolate(
    frame,
    [30, 60, 120, 150, 240, 270],
    [0, 10, 10, 20, 20, 30],
    { extrapolateRight: "clamp" }
  );

  const isActivity2 = frame > 120;
  
  // Option 1 click animation (starts at frame 80 for act 1)
  const act1CorrectClicked = frame > 80;
  const act2CorrectClicked = frame > 200;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FAFAFA", justifyContent: "center", alignItems: "center" }}>
      <div 
        className="modal-overlay" 
        style={{ 
          background: "rgba(0,0,0,0.5)", 
          backdropFilter: "blur(4px)",
          position: "absolute",
          display: "flex",
          width: "100%",
          height: "100%"
        }}
      >
        <div 
          className="modal-loading-content"
          style={{ 
            transform: `scale(${scale})`, 
            opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" })
          }}
        >
          {/* Left Column */}
          <div className="loading-side">
            <div className="spinner" style={{ animation: "spin 1s linear infinite" }}></div>
            <p style={{ marginBottom: 0, fontWeight: 500, marginTop: "1.5rem" }}>
              Buscando suas informações...
            </p>
          </div>
          
          {/* Right Column (Mini-game) */}
          <div className="game-side" style={{ backgroundColor: "#23316E", color: "white" }}>
            <div className="game-screen" style={{ opacity: 1 }}>
              <div className="game-progress-container">
                <div className="game-progress-bar" style={{ width: `${progressWidth}%` }}></div>
              </div>
              <p className="game-counter">
                Atividade {isActivity2 ? "2" : "1"} de 15
              </p>
              
              <div className="game-activity-content">
                <div className="game-question-instruction">
                  {isActivity2 ? "Tradução de palavra" : "Tradução de palavra"}
                </div>
                <div className="game-question">
                  {isActivity2 ? "O que significa 'School'?" : "O que significa a palavra 'Hello'?"}
                </div>
                
                <div className="game-options" style={{ display: "grid", gap: "0.75rem" }}>
                  {!isActivity2 ? (
                    <>
                      <button className="game-option">A) Tchau</button>
                      <button className={`game-option ${act1CorrectClicked ? 'correct' : ''}`}>B) Olá</button>
                      <button className="game-option">C) Obrigado</button>
                      <button className="game-option">D) Por favor</button>
                    </>
                  ) : (
                    <>
                      <button className={`game-option ${act2CorrectClicked ? 'correct' : ''}`}>A) Escola</button>
                      <button className="game-option">B) Casa</button>
                      <button className="game-option">C) Trabalho</button>
                      <button className="game-option">D) Livro</button>
                    </>
                  )}
                </div>
                
                <div className="game-feedback" style={{ minHeight: "1.5rem", marginTop: "1.5rem" }}>
                  {(act1CorrectClicked && !isActivity2) || act2CorrectClicked ? (
                    <span className="success" style={{ color: "#25D366" }}>Correto! ✓</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
