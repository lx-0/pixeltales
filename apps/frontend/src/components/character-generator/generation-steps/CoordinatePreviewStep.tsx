import { Label } from '@/lib/shadcn-ui/label';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

// TODO: Define this structure properly based on backend response
interface ExtractedCoordinate {
  id: string; // e.g., 'idle_right_0', 'walk_down_1'
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CoordinatePreviewStepProps {
  animationSheetUrl: string | null;
  extractedCoordinates: ExtractedCoordinate[] | null;
  error: string | null;
  isLoading?: boolean;
}

export function CoordinatePreviewStep({
  animationSheetUrl,
  extractedCoordinates,
  error,
  isLoading = false,
}: CoordinatePreviewStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!animationSheetUrl || !extractedCoordinates || isLoading) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Set up image onload handler
    const handleImageLoad = () => {
      if (!canvas || !img) return;

      // Set canvas size to match image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw the image first
      ctx.drawImage(img, 0, 0);

      // Then overlay rectangles for each coordinate with semi-transparent fill
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'; // Green border
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; // Subtle green fill

      extractedCoordinates.forEach((coord) => {
        ctx.strokeRect(coord.x, coord.y, coord.width, coord.height);
        ctx.fillRect(coord.x, coord.y, coord.width, coord.height);

        // Optional: Add coordinate ID labels
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText(coord.id, coord.x + 2, coord.y + 12);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; // Reset fill for next rectangle
      });
    };

    img.onload = handleImageLoad;

    // If the image is already loaded (e.g. cached), manually trigger handler
    if (img.complete) {
      handleImageLoad();
    }
  }, [animationSheetUrl, extractedCoordinates, isLoading]);

  return (
    <div className="space-y-2">
      <Label className="text-gray-200">Confirm Extracted Sprites</Label>
      <p className="text-sm text-gray-400">
        The AI has identified individual sprite locations (highlighted below). Review and confirm.
      </p>
      <div className="relative flex justify-center p-4 border border-gray-700 rounded bg-gray-800/50 overflow-auto">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Hidden image used for drawing onto canvas */}
            <img
              ref={imageRef}
              src={animationSheetUrl || ''}
              alt="Generated Animation Sheet for Extraction"
              className="max-w-full h-auto image-rendering-pixelated opacity-0 absolute"
            />
            {/* Canvas for displaying image and highlights */}
            <canvas ref={canvasRef} className="max-w-full h-auto image-rendering-pixelated" />
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!extractedCoordinates && !error && !isLoading && (
        <p className="text-sm text-yellow-500">Loading coordinate data...</p>
      )}
    </div>
  );
}
