import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Cpu, Mail, Lock, User, ArrowLeft, Shield, Users, Eye, EyeOff, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '../lib/types';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('participant');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function fillDemoCredentials() {
    setMode('signin');
    setEmail('demo@hackmatch.ai');
    setPassword('HackMatchDemo123!');
    toast.success('Demo credentials filled. Use Demo Mode below if this account is not registered.');
  }

  function getPasswordStrength(value: string) {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      toast.error('Enter your email and password to continue');
      return;
    }
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(normalizedEmail, password);
      if (error) {
        toast.error(error.includes('Invalid login credentials')
          ? 'Email or password is incorrect. Use Demo Mode if you do not have an account yet.'
          : error);
        setLoading(false);
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } else {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const { error } = await signUp(normalizedEmail, password, fullName, role);
      if (error) {
        toast.error(error);
        setLoading(false);
      } else {
        toast.success('Account created! Please sign in.');
        setMode('signin');
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background bg-radial-fade flex items-center justify-center p-6">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 glow-blue">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl gradient-text">HackMatch AI</span>
        </Link>

        <Card className="glass-strong border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'signin'
                ? 'Sign in to access your dashboard'
                : 'Join HackMatch AI as an organizer or participant'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'signup' && password && (
                  <div className="space-y-1" aria-live="polite">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${level <= getPasswordStrength(password) ? 'bg-primary' : 'bg-muted'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getPasswordStrength(password) >= 4 ? 'Strong password' : 'Use 8+ characters with upper/lowercase, a number, and a symbol'}
                    </p>
                  </div>
                )}
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(v) => setRole(v as UserRole)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2 glass rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-all">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="cursor-pointer flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm">Organizer</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 glass rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-all">
                      <RadioGroupItem value="participant" id="participant" />
                      <Label htmlFor="participant" className="cursor-pointer flex items-center gap-2">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="text-sm">Participant</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {mode === 'signin' && (
              <Button type="button" variant="outline" className="mt-3 w-full" onClick={fillDemoCredentials}>
                <WandSparkles className="mr-2 h-4 w-4" />
                Fill Demo Credentials
              </Button>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              toast.success('Demo mode opened');
              navigate('/dashboard');
            }}
            className="text-sm text-primary/70 hover:text-primary transition-colors"
          >
            Continue in Demo Mode (no login required)
          </button>
        </div>
      </div>
    </div>
  );
}
