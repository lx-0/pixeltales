import { LoginButton, UserAvatar } from '@/lib/auth';
import { Button } from '@/lib/shadcn-ui/button';
import { User } from '@yesterday-ai/user-contracts';
import { Layout, Volume2, VolumeX } from 'lucide-react';

interface AppControlsProps {
  user: User | null;
  loading: boolean;
  isSoundEnabled: boolean;
  handleSoundToggle: () => void;
  toggleViewMode: () => void;
  children?: React.ReactNode;
}

export function AppControls({
  user,
  loading,
  isSoundEnabled,
  handleSoundToggle,
  toggleViewMode,
  children,
}: AppControlsProps) {
  return (
    <div className="fixed top-2 right-2 sm:top-6 sm:right-4 z-50 flex gap-2">
      {children}

      {/* User Avatar / Login Button */}
      <div className="flex items-center gap-2 z-10">
        {/* Conditionally render based on loading and user state */}
        {!loading && user && <UserAvatar />}
        {!loading && !user && <LoginButton />}
        {/* Optionally show a spinner or placeholder during loading */}
        {loading && <span className="text-xs">Loading...</span>}
      </div>

      {/* Sound Toggle Button */}
      <Button
        variant="secondary"
        size="icon"
        className="text-white bg-gray-700 hover:bg-gray-600"
        onClick={handleSoundToggle}
        title={isSoundEnabled ? 'Disable Sound' : 'Enable Sound'}
      >
        {isSoundEnabled ? (
          <Volume2 className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <VolumeX className="h-[1.2rem] w-[1.2rem]" />
        )}
        <span className="sr-only">{isSoundEnabled ? 'Disable Sound' : 'Enable Sound'}</span>
      </Button>

      {/* View Mode Toggle Button */}
      <Button
        variant="secondary"
        size="icon"
        className="text-white bg-gray-700 hover:bg-gray-600"
        onClick={toggleViewMode}
      >
        <Layout className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle View Mode</span>
      </Button>
    </div>
  );
}
