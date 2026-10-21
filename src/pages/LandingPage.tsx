import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Brain,
  Trophy,
  Target,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  Cpu,
  Zap,
  Network,
  TrendingUp,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background bg-radial-fade overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-blue">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg gradient-text">HackMatch AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <Link to="/methodology"><span className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Methodology</span></Link>
            <Link to="/about"><span className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</span></Link>
            <Link to="/auth"><Button size="sm" variant="ghost">Sign In</Button></Link>
          </div>
          <Link to="/auth" className="md:hidden">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-muted-foreground mb-8 animate-fade-in-up">
            <Sparkles className="h-4 w-4 text-accent" />
            AI-Powered Team Formation & Success Prediction
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text">HackMatch AI</span>
          </h1>

          <p className="text-xl md:text-2xl text-foreground/90 mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Build Better Teams. Predict Better Outcomes.
          </p>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            An AI-powered hackathon team formation and success prediction system that creates balanced teams based on skills, interests, experience and project requirements.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/auth">
              <Button size="lg" className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          {[
            { label: 'Demo Participants', value: '30' },
            { label: 'Sample Teams', value: '5+' },
            { label: 'Prediction Accuracy', value: 'Explainable' },
            { label: 'Skill Categories', value: '7' },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-xl p-4 text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From participant registration to AI-powered team formation and success prediction in four steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Register Participants', desc: 'Participants submit their skills, experience, interests, and preferred roles through a guided form.' },
              { icon: CalendarPlus, title: 'Configure Hackathon', desc: 'Organizers set team size, project domain, required skills, and difficulty level.' },
              { icon: Brain, title: 'AI Forms Teams', desc: 'The algorithm analyzes compatibility, diversity, and coverage to generate optimal teams.' },
              { icon: TrendingUp, title: 'Predict Success', desc: 'An explainable weighted model predicts each team success score with full breakdown.' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="glass rounded-2xl p-6 h-full hover:border-primary/30 transition-all duration-300 group">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs text-primary/60 font-mono mb-2">STEP {i + 1}</div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-secondary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">AI-Powered Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete system for hackathon team formation with explainable AI at its core.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'AI Team Formation', desc: 'Weighted optimization algorithm considers skill compatibility, diversity, role coverage, and experience balance.' },
              { icon: Trophy, title: 'Success Prediction', desc: 'Explainable weighted model predicts team success scores (0-100) with detailed component breakdown.' },
              { icon: Target, title: 'Skill Matching', desc: 'Matches participant skills against hackathon project requirements with coverage visualization.' },
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Interactive charts for skill distribution, team scores, experience levels, and role distribution.' },
              { icon: Network, title: 'Recommendation Engine', desc: 'AI-generated strengths, weaknesses, and improvement suggestions for every team.' },
              { icon: Zap, title: 'Export & Share', desc: 'Export participant lists, generated teams, scores, and predictions as CSV files.' },
            ].map((feature, i) => (
              <Card key={i} className="glass border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-strong rounded-3xl p-10 md:p-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-6 animate-float">
              <Cpu className="h-8 w-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">About the Project</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              HackMatch AI is an academic AIML engineering project demonstrating the application of
              artificial intelligence in hackathon team formation. It uses feature extraction, skill
              encoding, and a weighted optimization algorithm with an architecture designed for future
              ML model integration.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {['React', 'TypeScript', 'Supabase', 'FastAPI', 'Recharts', 'Tailwind CSS'].map(tech => (
                <span key={tech} className="px-3 py-1 rounded-full glass text-sm text-muted-foreground">{tech}</span>
              ))}
            </div>
            <Link to="/about">
              <Button variant="outline">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Build Better Teams?</h2>
          <p className="text-muted-foreground mb-8">
            Get started with HackMatch AI and let the algorithm find the optimal team composition for your next hackathon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">
                View Demo Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <span className="font-semibold gradient-text">HackMatch AI</span>
            <span className="text-sm text-muted-foreground ml-2">Academic AIML Project</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
