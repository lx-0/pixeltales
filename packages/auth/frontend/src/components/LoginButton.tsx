import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@yesterday-ai/shadcn-ui';
import { LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { authService } from '../services/auth';

export default function LoginButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthServiceReady, setIsAuthServiceReady] = useState(false);
  const { error: authError } = useAuth();

  useEffect(() => {
    setIsAuthServiceReady(authService.supabase !== null);
  }, [authService.supabase]);

  return isAuthServiceReady && authService.supabase ? (
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
        </DialogContent>
      </Dialog>
    </div>
  ) : (
    <div>Loading...</div>
  );
}
