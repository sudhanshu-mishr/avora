import {
  Home, Compass, Lightbulb, FolderKanban, Users, Store, BookOpen,
  MessageSquare, Sparkles, Bell, User, Settings,
} from 'lucide-react';
export const NAV = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/connect', label: 'Connect', icon: Users },
  { href: '/communities', label: 'Communities', icon: Store },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/launch', label: 'Launch', icon: Rocket },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/ai', label: 'AVORA AI', icon: Sparkles },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;
// Rocket import placeholder below for clarity
import { Rocket } from 'lucide-react';