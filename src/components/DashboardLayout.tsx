import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Users,
  Trophy,
  CalendarPlus,
  Brain,
  Info,
  LogOut,
  Menu,
  X,
  Cpu,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hackathon', label: 'Create Hackathon', icon: CalendarPlus },
  { to: '/teams', label: 'AI Team Formation', icon: Trophy },
  { to: '/participants', label: 'Participants', icon: Users },
  { to: '/methodology', label: 'AI Methodology', icon: Brain },
  { to: '/about', label: 'About Project', icon: Info },
];

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-background bg-radial-fade">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border glass">
        <div className="flex items-center gap-2">
          <Cpu className="h-6 w-6 text-primary" />
          <span className="font-bold gradient-text">HackMatch AI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-border glass transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex items-center gap-2 p-6 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 glow-blue">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="font-bold text-lg gradient-text">HackMatch AI</span>
                <p className="text-xs text-muted-foreground">Team Formation Engine</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary glow-blue'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent font-semibold text-sm">
                  {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{profile?.full_name ?? 'User'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role ?? 'participant'}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
