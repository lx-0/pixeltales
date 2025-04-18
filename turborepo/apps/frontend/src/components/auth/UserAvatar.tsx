import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/lib/shadcn-ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/lib/shadcn-ui/dropdown-menu';
import { LogOut, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function UserAvatar() {
  const { user, signOut } = useAuth();
  const [userInitials, setUserInitials] = useState('');
  const [characterImage, setCharacterImage] = useState<string | null>(null);

  useEffect(() => {
    updateUserDetails();
  }, [user]);

  const updateUserDetails = () => {
    if (!user) {
      setUserInitials('');
      return;
    }

    // Set user initials based on email or name
    const email = user.email || '';
    const name = user.name || '';

    if (name) {
      // Get initials from full name
      const initials = name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      setUserInitials(initials);
    } else if (email) {
      // Use first letter of email
      setUserInitials(email[0]?.toUpperCase() || 'U');
    } else {
      setUserInitials('U');
    }

    // Set a random character image from pixeltales
    const characters = [
      '/assets/characters/Bob_idle_anim_48x48.png',
      '/assets/characters/Cleaner_girl_idle_anim_48x48.png',
      '/assets/characters/ui_thinking_48x96.png',
    ];
    const randomIndex = Math.floor(Math.random() * characters.length);
    setCharacterImage(characters[randomIndex] || null);
  };

  // If no user is logged in, return null
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-10 w-10 cursor-pointer border-2 border-primary">
          {characterImage ? (
            <AvatarImage src={characterImage} alt="Character avatar" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer flex items-center" onClick={() => {}}>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex items-center text-red-500"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
