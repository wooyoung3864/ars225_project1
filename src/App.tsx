import { useEffect, useRef, useState } from "react";
import "./App.css";

const ASSETS_FOLDER = '/ars225_project1/assets/';

const AVAILABLE_IMAGES = [
  `${ASSETS_FOLDER}bsod.jpg`,
  `${ASSETS_FOLDER}google_404.png`,
  `${ASSETS_FOLDER}xp_bliss.png`
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const glitchTypesRef = useRef<(() => void)[]>([]);
  const [imageSrc, setImageSrc] = useState<string>(AVAILABLE_IMAGES[0]);
  const [_, setGlitchLevel] = useState(0);
  const [enabledEffects, setEnabledEffects] = useState({
    horizontal: true,
    vertical: true,
    pixels: true,
    rgb: true,
  });

  const glitchProfile = useRef({
    maxSlices: Math.floor(Math.random() * 10 + 10),
    sliceOffset: Math.floor(Math.random() * 60 + 10),
    noiseChance: Math.random() * 0.01 + 0.002,
    rgbShiftChance: Math.random() * 0.02 + 0.01,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();

    const drawClean = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (imgRef.current) {
        ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
      }
      setGlitchLevel(0);
    };

    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      imgRef.current = img;
      drawClean();

      const allTypes: (() => void)[] = [];
      if (enabledEffects.horizontal) allTypes.push(glitchHorizontalLine);
      if (enabledEffects.vertical) allTypes.push(glitchVerticalLine);
      if (enabledEffects.pixels) allTypes.push(glitchPixels);
      if (enabledEffects.rgb) allTypes.push(glitchRGB);

      glitchTypesRef.current = allTypes;
    };

    img.onerror = () => {
      console.error("❌ Failed to load image.");
    };

    const glitchHorizontalLine = () => {
      const ctx = canvas.getContext("2d")!;
      const y = Math.floor(Math.random() * canvas.height);
      const h = Math.floor(Math.random() * 20 + 5);
      const slice = ctx.getImageData(0, y, canvas.width, h);
      const offset = Math.floor(Math.random() * 80 - 40);
      ctx.putImageData(slice, offset, y);
    };

    const glitchVerticalLine = () => {
      const ctx = canvas.getContext("2d")!;
      const x = Math.floor(Math.random() * canvas.width);
      const w = Math.floor(Math.random() * 20 + 5);
      const slice = ctx.getImageData(x, 0, w, canvas.height);
      const offset = Math.floor(Math.random() * 80 - 40);
      ctx.putImageData(slice, x, offset);
    };

    const glitchPixels = () => {
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < glitchProfile.current.noiseChance) {
          const n = Math.random() * 255;
          data[i] = data[i + 1] = data[i + 2] = n;
        }
        if (Math.random() < 0.005) {
          const offset = 4 * Math.floor(Math.random() * 10);
          const j = (i + offset) % data.length;
          [data[i], data[j]] = [data[j], data[i]];
        }
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const glitchRGB = () => {
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < glitchProfile.current.rgbShiftChance) {
          [data[i], data[i + 1], data[i + 2]] = [
            data[i + 1],
            data[i + 2],
            data[i],
          ];
        }
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const glitch = () => {
      if (!imgRef.current) return;

      setGlitchLevel((prev) => {
        const newLevel = prev + 1;
        const types = glitchTypesRef.current;
        const count = glitchProfile.current.maxSlices;
        for (let i = 0; i < count; i++) {
          const fn = types[Math.floor(Math.random() * types.length)];
          if (fn) fn();
        }
        return newLevel;
      });
    };

    window.addEventListener("resize", () => {
      resizeCanvas();
      drawClean();
    });
    window.addEventListener("click", glitch);
    window.addEventListener("keydown", glitch);
    window.addEventListener("wheel", glitch);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("click", glitch);
      window.removeEventListener("keydown", glitch);
      window.removeEventListener("wheel", glitch);
    };
  }, [imageSrc, enabledEffects]);

  const toggleEffect = (type: keyof typeof enabledEffects) => {
    setEnabledEffects((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <>
      <canvas ref={canvasRef} className="glitch-canvas" />

      <div className="control-panel">
        <div className="panel-left">
          {AVAILABLE_IMAGES.map((src, idx) => (
            <button
              key={src}
              onClick={() => setImageSrc(src)}
              className={imageSrc === src ? "active" : ""}
            >
              Image {idx + 1}
            </button>
          ))}
        </div>

        <div className="panel-center">
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;

              const imageIndex = AVAILABLE_IMAGES.findIndex(src => src === imageSrc) + 1;

              const effectsMap: Record<string, string> = {
                horizontal: "x",
                vertical: "y",
                pixels: "Pixels",
                rgb: "RGB"
              };

              const effectList = Object.entries(enabledEffects)
                .filter(([_, enabled]) => enabled)
                .map(([key]) => effectsMap[key])
                .join("_");

              const filename = `image${imageIndex}_${effectList}.png`;

              const link = document.createElement("a");
              link.download = filename;
              link.href = canvas.toDataURL("image/png");
              link.click();
            }}
          >
            💾 Save
          </button>
        </div>

        <div className="panel-right">
          <button onClick={() => toggleEffect("horizontal")}>
            H-Slice {enabledEffects.horizontal ? "✅" : "❌"}
          </button>
          <button onClick={() => toggleEffect("vertical")}>
            V-Slice {enabledEffects.vertical ? "✅" : "❌"}
          </button>
          <button onClick={() => toggleEffect("pixels")}>
            Pixels {enabledEffects.pixels ? "✅" : "❌"}
          </button>
          <button onClick={() => toggleEffect("rgb")}>
            RGB {enabledEffects.rgb ? "✅" : "❌"}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
