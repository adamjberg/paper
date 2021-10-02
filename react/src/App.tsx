import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const ctx = useMemo(() => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');

      if (context) {
        context.canvas.width  = window.innerWidth;
        context.canvas.height = window.innerHeight;
      }

      return context;
    }
    return null
  }, [canvasRef])

  const draw = useCallback((e: MouseEvent) => {
      if (!ctx || !isDrawing) {
        return;
      }

      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineTo(e.clientX, e.clientY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX, e.clientY);
  }, [ctx, isDrawing])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsDrawing(true);
    draw(e);
  }, [draw])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    setIsDrawing(false);
    draw(e);
    ctx?.beginPath();
  }, [ctx, draw])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    draw(e);
  }, [draw])

  useEffect(() => {
    document.addEventListener("touchStart", handleMouseDown)
    document.addEventListener("touchend", handleMouseUp)
    document.addEventListener("touchmove", handleMouseMove)
    
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mousemove", handleMouseMove)

    return () => {
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp])

  return (
    <div className="App">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

export default App;
