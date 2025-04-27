import { API_BASE_URL, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config';
import { Button } from '@/lib/shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/shadcn-ui/dialog';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { authService } from '../services/auth';

// Development environment check
const isDev = import.meta.env.DEV;

export default function LoginButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { error: authError } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="bg-gray-700 hover:bg-gray-600 text-white"
      >
        <LogIn className="h-5 w-5 mr-1" />
        <span>Login</span>
      </Button>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Login to PixelTales</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create an account or sign in to save your favorite scenes and characters
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Auth
              supabaseClient={authService.supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    backgroundColor: '#374151', // gray-700
                    color: '#f9fafb', // gray-50
                  },
                  input: {
                    borderRadius: '0.375rem',
                    backgroundColor: '#1f2937', // bg-gray-800
                    color: '#e5e7eb', // text-gray-200
                    borderColor: '#374151', // border-gray-700
                  },
                  label: {
                    color: '#e5e7eb', // text-gray-200
                  },
                  anchor: {
                    color: '#9ca3af', // text-gray-400
                  },
                },
                variables: {
                  default: {
                    colors: {
                      brand: '#374151', // gray-700
                      brandAccent: '#4b5563', // gray-600
                      inputBackground: '#1f2937', // bg-gray-800
                      inputText: '#e5e7eb', // text-gray-200
                      inputBorder: '#374151', // border-gray-700
                      inputPlaceholder: '#9ca3af', // text-gray-400
                    },
                  },
                },
                className: {
                  input: 'placeholder:text-gray-500',
                  message: 'text-gray-300',
                  button: 'hover:bg-gray-600',
                },
              }}
              providers={[]}
            />
          </div>

          {/* Debug information in development */}
          {isDev && (
            <DialogFooter className="flex flex-col items-start border-t border-gray-700 pt-4">
              <div className="text-xs text-gray-400 space-y-1 w-full">
                <p>Debug Info:</p>
                <p>URL: {SUPABASE_URL ? '✓' : '✗'}</p>
                <p>Key: {SUPABASE_ANON_KEY ? '✓' : '✗'}</p>
                <p>Backend: {API_BASE_URL}</p>
                {authError && <p className="text-red-400">Error: {authError.message}</p>}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
