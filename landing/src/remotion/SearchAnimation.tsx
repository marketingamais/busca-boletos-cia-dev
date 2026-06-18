import { AbsoluteFill, interpolate, useCurrentFrame, spring } from "remotion";
import "./system-styles.css";

export const SearchAnimation = () => {
  const frame = useCurrentFrame();

  // Typing animation for CPF: "023.456.789-10"
  const fullText = "023.456.789-10";
  const typeWriterFrames = 40;
  const charsToShow = Math.min(
    fullText.length,
    Math.floor(interpolate(frame, [10, 10 + typeWriterFrames], [0, fullText.length], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }))
  );
  
  const currentText = fullText.substring(0, charsToShow);

  // Button click animation
  const clickStart = 70;
  const scale = spring({
    frame: frame - clickStart,
    fps: 30,
    config: {
      damping: 10,
      stiffness: 100,
    },
  });

  const buttonScale = frame > clickStart && frame < clickStart + 10 ? 0.95 : 1;

  // Zoom and Pan effect to focus on the input area
  const containerScale = spring({
    frame: frame,
    fps: 30,
    config: { damping: 200, stiffness: 20 },
  });
  
  const zoom = interpolate(containerScale, [0, 1], [1, 1.3]);
  const yOffset = interpolate(containerScale, [0, 1], [0, -30]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FAFAFA", justifyContent: "center", alignItems: "center" }}>
      <div 
        className="app-container" 
        style={{ 
          transform: `scale(${zoom}) translateY(${yOffset}px)`,
          transformOrigin: "center center",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <div style={{ width: "100%", maxWidth: "500px", padding: "2rem", background: "white", borderRadius: "24px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
          <h2 className="headline" style={{ textAlign: "center", marginBottom: "1rem", fontSize: "1.5rem" }}>
            Consulte seus débitos
          </h2>
          
          <div className="input-pill" style={{ marginBottom: "1.5rem" }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Digite o CPF do responsável"
              value={currentText}
              readOnly
            />
            <button 
              className="btn-submit"
              style={{ transform: `scale(${buttonScale})` }}
            >
              Consultar
            </button>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
