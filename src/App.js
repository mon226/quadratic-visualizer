import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function QuadraticVisualizer() {
  const [equation, setEquation] = useState('x^2-(2*a-1)*x+a^2');
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(5);
  const [yMin, setYMin] = useState(-5);
  const [yMax, setYMax] = useState(10);
  const [aMin, setAMin] = useState(-2);
  const [aMax, setAMax] = useState(2);
  const [currentA, setCurrentA] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Temporary settings state
  const [tempXMin, setTempXMin] = useState(-5);
  const [tempXMax, setTempXMax] = useState(5);
  const [tempYMin, setTempYMin] = useState(-5);
  const [tempYMax, setTempYMax] = useState(10);
  const [tempAMin, setTempAMin] = useState(-2);
  const [tempAMax, setTempAMax] = useState(2);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Number stepper component
  const NumberStepper = ({ value, onChange, step = 1, label }) => (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(value - step)}
          className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center transition"
        >
          ◁
        </button>
        <div className="w-16 text-center font-semibold">{value}</div>
        <button
          onClick={() => onChange(value + step)}
          className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center transition"
        >
          ▷
        </button>
      </div>
    </div>
  );

  // Parse and evaluate the equation
  const evaluateEquation = (x, a) => {
    try {
      // Replace ^ with ** for exponentiation
      let expr = equation.replace(/\^/g, '**');
      // Replace a with the actual value
      expr = expr.replace(/a/g, `(${a})`);
      // Replace x with the actual value
      expr = expr.replace(/x/g, `(${x})`);
      // Evaluate the expression
      return eval(expr);
    } catch (e) {
      return null;
    }
  };

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Transform coordinates
    const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Vertical grid lines
    const xStep = (xMax - xMin) / 10;
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), 0);
      ctx.lineTo(toCanvasX(x), height);
      ctx.stroke();
    }

    // Horizontal grid lines
    const yStep = (yMax - yMin) / 10;
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(y));
      ctx.lineTo(width, toCanvasY(y));
      ctx.stroke();
    }

    // Draw axes (thicker and black)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    // Y-axis
    if (xMin <= 0 && xMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), 0);
      ctx.lineTo(toCanvasX(0), height);
      ctx.stroke();
    }

    // X-axis
    if (yMin <= 0 && yMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(0));
      ctx.lineTo(width, toCanvasY(0));
      ctx.stroke();
    }

    // Draw scale labels
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X-axis labels
    const xLabelStep = Math.ceil((xMax - xMin) / 10);
    for (let x = Math.ceil(xMin); x <= xMax; x += xLabelStep) {
      if (x !== 0) { // Skip 0 to avoid overlap with y-axis
        const canvasX = toCanvasX(x);
        if (yMin <= 0 && yMax >= 0) {
          ctx.fillText(x.toString(), canvasX, toCanvasY(0) + 5);
        } else {
          ctx.fillText(x.toString(), canvasX, height - 20);
        }
      }
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yLabelStep = Math.ceil((yMax - yMin) / 10);
    for (let y = Math.ceil(yMin); y <= yMax; y += yLabelStep) {
      if (y !== 0) { // Skip 0 to avoid overlap with x-axis
        const canvasY = toCanvasY(y);
        if (xMin <= 0 && xMax >= 0) {
          ctx.fillText(y.toString(), toCanvasX(0) - 5, canvasY);
        } else {
          ctx.fillText(y.toString(), 30, canvasY);
        }
      }
    }

    // Draw origin label
    if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('0', toCanvasX(0) - 5, toCanvasY(0) + 5);
    }

    // Draw the function
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    const numPoints = 500;
    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + (i / numPoints) * (xMax - xMin);
      const y = evaluateEquation(x, currentA);

      if (y !== null && !isNaN(y) && isFinite(y)) {
        const canvasX = toCanvasX(x);
        const canvasY = toCanvasY(y);

        if (canvasY >= -10 && canvasY <= height + 10) {
          if (!started) {
            ctx.moveTo(canvasX, canvasY);
            started = true;
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        } else {
          started = false;
        }
      }
    }
    ctx.stroke();

  }, [equation, xMin, xMax, yMin, yMax, currentA]);

  // Animation loop
  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        setCurrentA((prev) => {
          const next = prev + (aMax - aMin) / 200 * 0.75;
          if (next > aMax) {
            return aMin;
          }
          return next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, aMin, aMax]);

  const handleReset = () => {
    setCurrentA(aMin);
    setIsAnimating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            関数式
          </label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">y =</span>
            <input
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例: x^2-(2*a-1)*x+a^2"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ※ べき乗は ^ 、掛け算は * を使用（例: 2*a, x^2, -1*x^2）
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full border border-gray-300 rounded"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {isAnimating ? <Pause size={20} /> : <Play size={20} />}
              {isAnimating ? '一時停止' : '再生'}
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            aの値: {currentA.toFixed(3)}
          </label>
          <input
            type="range"
            min={aMin}
            max={aMax}
            step={(aMax - aMin) / 100}
            value={currentA}
            onChange={(e) => {
              setCurrentA(parseFloat(e.target.value));
              setIsAnimating(false);
            }}
            className="w-full"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4">
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              // Sync temp values when opening settings
              if (!showSettings) {
                setTempXMin(xMin);
                setTempXMax(xMax);
                setTempYMin(yMin);
                setTempYMax(yMax);
                setTempAMin(aMin);
                setTempAMax(aMax);
              }
            }}
            className="w-full text-left font-semibold text-gray-700 mb-3 flex items-center justify-between"
          >
            設定
            <span className="text-xl">{showSettings ? '−' : '+'}</span>
          </button>

          {showSettings && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <NumberStepper
                  value={tempXMin}
                  onChange={setTempXMin}
                  label="X軸 最小"
                />
                <NumberStepper
                  value={tempXMax}
                  onChange={setTempXMax}
                  label="X軸 最大"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberStepper
                  value={tempYMin}
                  onChange={setTempYMin}
                  label="Y軸 最小"
                />
                <NumberStepper
                  value={tempYMax}
                  onChange={setTempYMax}
                  label="Y軸 最大"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberStepper
                  value={tempAMin}
                  onChange={setTempAMin}
                  step={0.5}
                  label="a 最小"
                />
                <NumberStepper
                  value={tempAMax}
                  onChange={setTempAMax}
                  step={0.5}
                  label="a 最大"
                />
              </div>

              <button
                onClick={() => {
                  setXMin(tempXMin);
                  setXMax(tempXMax);
                  setYMin(tempYMin);
                  setYMax(tempYMax);
                  setAMin(tempAMin);
                  setAMax(tempAMax);
                  // Reset current A if it's outside the new range
                  if (currentA < tempAMin || currentA > tempAMax) {
                    setCurrentA(tempAMin);
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition mt-4"
              >
                設定を保存
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}