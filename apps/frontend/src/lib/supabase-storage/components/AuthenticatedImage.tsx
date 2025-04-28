import { authService } from '@yesterday-ai/auth-frontend';
import { Skeleton } from '@yesterday-ai/shadcn-ui';
import { toBoolean } from '@yesterday-ai/utils-shared';
import { ImageIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SupabaseStorageApi } from '../services/supabase-storage-api.service';

interface AuthenticatedImageProps {
  /**
   * The source of the image
   * Can be a remote URL or a data URL
   */
  src: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  width?: number;
  height?: number;
}

/**
 * Component for displaying images that require authentication
 * Fetches the image with proper authentication and displays it as a blob URL
 */
const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  alt = 'Image',
  className = '',
  fallbackClassName = '',
  width,
  height,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (toBoolean(import.meta.env.VITE_DEBUG_DASHBOARD_IMAGE)) {
        console.log(`[DEBUG:${AuthenticatedImage.name}] Loading image:`, src);
      }
      if (!src) {
        setLoading(false);
        setError(true);
        setImageUrl(null);
        return;
      }

      if (src.startsWith('data:')) {
        if (toBoolean(import.meta.env.VITE_DEBUG_DASHBOARD_IMAGE)) {
          console.log(`[DEBUG:${AuthenticatedImage.name}] Data URL:`, src);
        }
        setImageUrl(src);
      } else {
        fetchImage();
      }
    };

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);

        if (toBoolean(import.meta.env.VITE_DEBUG_DASHBOARD_IMAGE)) {
          console.log(
            `[DEBUG:${AuthenticatedImage.name}] Fetching remote image with authentication:`,
            src,
          );
        }

        // Make authenticated request
        const response = await new SupabaseStorageApi(authService.getApi().getOptions()).getFile(
          src,
        );

        // Create a blob URL from the response
        if (isMounted && response) {
          objectUrl = URL.createObjectURL(response);
          setImageUrl(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching authenticated image:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();

    // Clean up on unmount
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (loading) {
    return <Skeleton className={`${className || 'w-10 h-10'}`} />;
  }

  if (error || !imageUrl) {
    return (
      <div
        className={`bg-muted flex items-center justify-center ${fallbackClassName || className || 'w-10 h-10'}`}
      >
        <ImageIcon className="w-1/2 h-1/2 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={() => setError(true)}
    />
  );
};

export default AuthenticatedImage;
