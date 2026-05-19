'use client';

import { useEffect, useRef, useState } from 'react';
import { BiPencil, BiEraser, BiTrash, BiX, BiDownload } from 'react-icons/bi';
import { getSocket } from '../../lib/socket';

interface WhiteboardProps {
  roomId: string;
  onClose: () => void;
}

interface DrawData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  lineWidth: number;
}

export default function Whiteboard({ roomId, onClose }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#8b5cf6'); // Default purple
  const [lineWidth, setLineWidth] = useState(3);
  const [isErasing, setIsErasing] = useState(false);
  
  const currentPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const socket = getSocket();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    // Set real canvas dimensions based on CSS display size to avoid stretching
    const resizeCanvas = () => {
      const parent = containerRef.current;
      if (parent && canvas) {
        // Save current drawing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx?.drawImage(canvas, 0, 0);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // Restore drawing and set background
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; // White background
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    };

    // Initial sizing
    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    window.addEventListener('resize', resizeCanvas);

    // Socket Listeners for remote drawing
    const onDrawEvent = (data: DrawData) => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth, false);
    };
    
    const onClearBoard = () => {
      if (ctx && canvas) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    socket.on('draw', onDrawEvent);
    socket.on('clear-board', onClearBoard);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      socket.off('draw', onDrawEvent);
      socket.off('clear-board', onClearBoard);
    };
  }, [roomId, socket]);

  // Actually draw on the canvas
  const drawLine = (x0: number, y0: number, x1: number, y1: number, colorToUse: string, widthToUse: number, emit: boolean) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = colorToUse;
    ctx.lineWidth = widthToUse;
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;

    // Only emit percentages to make drawing responsive across different screen sizes
    const w = canvas.width;
    const h = canvas.height;

    socket.emit('draw', {
      roomId,
      data: {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: colorToUse,
        lineWidth: widthToUse,
      }
    });
  };

  // Convert raw mouse coordinates to actual canvas coordinates
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    currentPos.current = { x, y };
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    
    // If erasing, use white color and a larger brush
    const actualColor = isErasing ? '#ffffff' : color;
    const actualWidth = isErasing ? lineWidth * 3 : lineWidth;

    drawLine(currentPos.current.x, currentPos.current.y, x, y, actualColor, actualWidth, true);
    currentPos.current = { x, y };
  };

  const onMouseUp = () => {
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      socket.emit('clear-board', { roomId });
    }
  };

  const downloadBoard = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Whiteboard_${new Date().toISOString()}.png`;
      a.click();
    }
  };

  const colors = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#1f2937'];

  return (
    <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full h-full max-w-6xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header Toolbar */}
        <div className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold tracking-wide mr-4">Collaborative Board</h2>
            
            <div className="h-8 w-px bg-zinc-800 mx-2" />
            
            {/* Tool Toggles */}
            <button
              onClick={() => setIsErasing(false)}
              className={`p-2 rounded-lg transition-colors ${!isErasing ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              title="Pen Tool"
            >
              <BiPencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsErasing(true)}
              className={`p-2 rounded-lg transition-colors ${isErasing ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              title="Eraser Tool"
            >
              <BiEraser className="w-5 h-5" />
            </button>

            <div className="h-8 w-px bg-zinc-800 mx-2" />
            
            {/* Color Picker */}
            <div className="flex items-center gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setIsErasing(false);
                  }}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c && !isErasing ? 'scale-125 ring-2 ring-offset-2 ring-offset-zinc-900 ring-white' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            <div className="h-8 w-px bg-zinc-800 mx-2" />
            
            {/* Brush Size */}
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-24 accent-indigo-500"
              title="Brush Size"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={downloadBoard} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Download Image">
              <BiDownload className="w-5 h-5" />
            </button>
            <button onClick={clearBoard} className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition-colors" title="Clear Board">
              <BiTrash className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 ml-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-lg transition-colors" title="Close Board">
              <BiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 bg-white cursor-crosshair relative touch-none"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseOut={onMouseUp}
            onTouchStart={onMouseDown}
            onTouchMove={onMouseMove}
            onTouchEnd={onMouseUp}
            className="absolute inset-0"
          />
        </div>
      </div>
    </div>
  );
}
