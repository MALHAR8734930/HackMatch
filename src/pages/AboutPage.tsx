 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Info, Target, BookOpen, Code2, Rocket, AlertCircle,
  CheckCircle2, Cpu, Server, Database, Brain,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Info className="h-8 w-8 text-primary" />
          About the Project
        </h1>
        <p className="text-muted-foreground">
          HackMatch AI - An academic AIML engineering project for hackathon team formation and success prediction.
        </p>
      </div>

      {/* Problem Statement */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-400" />Problem Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Hackathon organizers face a significant challenge when forming teams. Manual team formation often results in:
          </p>
          <ul className="space-y-1.5 pl-4">
            <li>• Unbalanced teams with skill gaps (e.g., all developers, no designers)</li>
            <li>• Clustering of similar experience levels, leaving beginners without mentorship</li>
            <li>• Poor project-skill alignment, reducing the quality of outcomes</li>
            <li>• Subjective bias in team composition</li>
            <li>• No systematic way to predict how well a team will perform</li>
          </ul>
          <p className="pt-2">
            There is a need for an intelligent system that can automatically form balanced teams and predict their likelihood of success based on objective criteria.
          </p>
        </CardContent>
      </Card>

      {/* Objectives */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Objectives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {[
            'Develop an AI-powered system for automatic hackathon team formation',
            'Create a weighted optimization algorithm that considers skills, experience, roles, and interests',
            'Implement an explainable success prediction model with a clear score breakdown',
            'Build a recommendation engine that identifies team strengths, weaknesses, and improvements',
            'Design the architecture to allow future replacement of the scoring model with a trained ML model',
            'Provide interactive analytics and visualizations for organizers',
            'Enable CSV export of participants, teams, scores, and predictions',
          ].map((obj, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>{obj}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-accent" />Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The project follows a structured AI/ML pipeline:</p>
          <div className="space-y-2">
            {[
              { step: 'Data Collection', desc: 'Participant data collected via structured registration form with skill arrays, experience levels, and role preferences.' },
              { step: 'Feature Engineering', desc: 'Raw data transformed into normalized numerical features (0-1 range): experience scores, skill diversity, technical depth.' },
              { step: 'Skill Encoding', desc: 'Binary encoding of skills against a vocabulary built from all participants, enabling similarity computation.' },
              { step: 'Team Formation', desc: 'Greedy optimization algorithm maximizes team compatibility while ensuring balanced sizes and role diversity.' },
              { step: 'Success Prediction', desc: 'Explainable weighted model combines 6 sub-scores (project match, diversity, experience, roles, compatibility, hackathon experience) into a 0-100 prediction.' },
              { step: 'Recommendation Generation', desc: 'Rule-based engine analyzes team composition and generates human-readable insights.' },
            ].map((item, i) => (
              <div key={i} className="glass rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-primary/60 font-mono">{i + 1}</span>
                  <span className="font-medium text-foreground">{item.step}</span>
                </div>
                <p className="text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Code2 className="h-5 w-5 text-blue-400" />Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { icon: Code2, name: 'React + TypeScript', desc: 'Frontend framework with type safety' },
              { icon: Cpu, name: 'Tailwind CSS + shadcn/ui', desc: 'Modern UI design system' },
              { icon: Database, name: 'Supabase PostgreSQL', desc: 'Database with row-level security' },
              { icon: Server, name: 'Supabase Auth', desc: 'Email/password authentication' },
              { icon: Brain, name: 'Recharts', desc: 'Interactive data visualizations' },
              { icon: Rocket, name: 'Vite', desc: 'Fast build tooling and dev server' },
            ].map(tech => (
              <div key={tech.name} className="glass rounded-lg p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <tech.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future Scope */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Rocket className="h-5 w-5 text-emerald-400" />Future Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {[
            'Train a regression model on historical hackathon outcomes to replace the weighted scoring',
            'Add NLP-based analysis of participant project descriptions for better matching',
            'Implement real-time team collaboration features during the hackathon',
            'Add support for multi-track hackathons with different project domains',
            'Integrate with popular hackathon platforms (Devpost, MLH)',
            'Add team dynamics analysis using graph neural networks',
            'Support for timezone-aware virtual team formation',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Limitations */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="h-5 w-5 text-orange-400" />Limitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {[
            'The current scoring model uses fixed weights rather than learned parameters',
            'No historical hackathon data available to train a machine learning model',
            'Skill matching is based on self-reported data without verification',
            'The greedy optimization algorithm may not find the globally optimal team configuration',
            'Recommendations are rule-based and may not capture nuanced team dynamics',
            'Does not account for interpersonal factors like working style or communication preferences',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Academic context */}
      <Card className="glass border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Academic AIML Engineering Project</h3>
              <p className="text-xs text-muted-foreground">Demonstrating AI/ML concepts in practice</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This project demonstrates the application of artificial intelligence and machine learning concepts
            including feature engineering, skill encoding, optimization algorithms, and explainable AI.
            The architecture is designed to evolve from a rule-based system to a trained ML model.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Feature Engineering', 'Binary Encoding', 'Greedy Optimization', 'Weighted Scoring', 'Explainable AI', 'Jaccard Similarity', 'Cosine Similarity'].map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
