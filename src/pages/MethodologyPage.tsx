import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Brain, Database, Cpu, Users, Target, TrendingUp,
  Lightbulb, ArrowRight, Code2, GitBranch, Layers, Zap, AlertTriangle,
} from 'lucide-react';

const PIPELINE_STEPS = [
  { icon: Users, title: 'Participant Data', desc: 'Raw input from registration forms: skills, experience, interests, roles, and project preferences.' },
  { icon: Layers, title: 'Feature Extraction', desc: 'Transforms raw participant data into normalized numerical features (0-1 range) for algorithmic processing.' },
  { icon: Code2, title: 'Skill Encoding', desc: 'Binary encoding of skills against a vocabulary built from all participants. Each skill becomes a feature dimension.' },
  { icon: GitBranch, title: 'Team Formation', desc: 'Greedy optimization algorithm that maximizes compatibility, diversity, and coverage while balancing team sizes.' },
  { icon: Target, title: 'Feature Calculation', desc: 'Team-level features computed: skill coverage, diversity, role coverage, experience balance, compatibility.' },
  { icon: TrendingUp, title: 'Success Prediction', desc: 'Explainable weighted scoring model combines 6 normalized sub-scores into a 0-100 success prediction.' },
  { icon: Lightbulb, title: 'Recommendation', desc: 'Rule-based engine analyzes team gaps and generates human-readable strengths, weaknesses, and improvements.' },
];

const WEIGHTS = [
  { label: 'Project-Skill Match', weight: 30, color: 'hsl(217 91% 60%)' },
  { label: 'Skill Diversity', weight: 20, color: 'hsl(263 70% 60%)' },
  { label: 'Experience', weight: 15, color: 'hsl(172 67% 45%)' },
  { label: 'Role Coverage', weight: 15, color: 'hsl(43 90% 60%)' },
  { label: 'Team Compatibility', weight: 10, color: 'hsl(340 75% 55%)' },
  { label: 'Hackathon Experience', weight: 10, color: 'hsl(280 65% 60%)' },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          AI Methodology
        </h1>
        <p className="text-muted-foreground">
          A detailed explanation of the AI/ML pipeline powering HackMatch AI, from raw participant data to team recommendations.
        </p>
      </div>

      {/* Architecture diagram */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" />Architecture Diagram</CardTitle>
          <CardDescription>The full prediction pipeline from data input to recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={i}>
                <div className="glass rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary/60 font-mono">STEP {i + 1}</span>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="h-4 w-4 text-primary/30 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input Data */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Database className="h-5 w-5 text-accent" />1. Input Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The system collects structured participant data through a registration form:</p>
          <div className="grid md:grid-cols-2 gap-2">
            {['Full Name & Email', 'College & Department', 'Technical Skills (array)', 'Programming Languages (array)', 'AI/ML Skills (array)', 'Web Dev Skills (array)', 'Database Skills (array)', 'UI/UX Skills (array)', 'Soft Skills (array)', 'Areas of Interest (array)', 'Experience Level (categorical)', 'Previous Hackathon Experience', 'Preferred Team Role (categorical)', 'Project Interests (array)'].map(field => (
              <div key={field} className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {field}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Engineering */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Layers className="h-5 w-5 text-emerald-400" />2. Feature Engineering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Raw data is transformed into normalized numerical features in the 0-1 range:</p>
          <ul className="space-y-2">
            <li className="glass rounded-lg p-3"><strong className="text-foreground">Experience Score:</strong> Beginner=0.25, Intermediate=0.50, Advanced=0.75, Expert=1.0</li>
            <li className="glass rounded-lg p-3"><strong className="text-foreground">Hackathon Experience Score:</strong> Parsed from text, normalized to 0-1 (5+ hackathons = 1.0)</li>
            <li className="glass rounded-lg p-3"><strong className="text-foreground">Skill Diversity:</strong> Total unique skills / max skills across all participants</li>
            <li className="glass rounded-lg p-3"><strong className="text-foreground">Technical Depth:</strong> Ratio of advanced skills to total skills</li>
          </ul>
        </CardContent>
      </Card>

      {/* Skill Encoding */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Code2 className="h-5 w-5 text-blue-400" />3. Skill Encoding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Skills are encoded using binary encoding against a vocabulary built from all participants:</p>
          <div className="glass rounded-lg p-4 font-mono text-xs space-y-1">
            <div><span className="text-primary">vocabulary</span> = buildSkillVocabulary(allParticipants) <span className="text-muted-foreground">// e.g., ["Python", "React", "TensorFlow", ...]</span></div>
            <div><span className="text-primary">skillVector</span>[i] = 1 <span className="text-muted-foreground">// if participant has vocabulary[i]</span></div>
            <div><span className="text-primary">skillVector</span>[i] = 0 <span className="text-muted-foreground">// otherwise</span></div>
          </div>
          <p>Similarity between participants is computed using <strong className="text-foreground">Jaccard similarity</strong> for set-based features and <strong className="text-foreground">cosine similarity</strong> for vector-based features.</p>
        </CardContent>
      </Card>

      {/* Team Formation */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><GitBranch className="h-5 w-5 text-amber-400" />4. Team Formation Algorithm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The algorithm uses a <strong className="text-foreground">greedy optimization</strong> approach:</p>
          <div className="space-y-2">
            <div className="glass rounded-lg p-3"><strong className="text-primary">Phase 1 - Anchoring:</strong> Most experienced participants are distributed across teams as anchors.</div>
            <div className="glass rounded-lg p-3"><strong className="text-primary">Phase 2 - Greedy Assignment:</strong> Each remaining participant is assigned to the team where they add the most marginal value.</div>
          </div>
          <p className="pt-2"><strong className="text-foreground">Compatibility Score</strong> between two participants combines:</p>
          <div className="grid md:grid-cols-2 gap-2">
            {[
              { label: 'Skill Complementarity', weight: '35%' },
              { label: 'Shared Interests', weight: '25%' },
              { label: 'Experience Compatibility', weight: '20%' },
              { label: 'Role Diversity', weight: '20%' },
            ].map(item => (
              <div key={item.label} className="glass rounded-lg p-3 flex justify-between">
                <span>{item.label}</span>
                <Badge variant="outline">{item.weight}</Badge>
              </div>
            ))}
          </div>
          <p className="pt-2">The algorithm penalizes teams with too many participants sharing the same primary skill, ensuring <strong className="text-foreground">role diversity</strong>.</p>
        </CardContent>
      </Card>

      {/* Success Prediction */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-purple-400" />5. Success Prediction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>An <strong className="text-foreground">explainable weighted scoring model</strong> predicts team success (0-100) from 6 normalized sub-scores:</p>
          <div className="space-y-2">
            {WEIGHTS.map(w => (
              <div key={w.label} className="flex items-center gap-3">
                <div className="w-32 text-sm">{w.label}</div>
                <div className="flex-1 h-6 rounded-full bg-secondary/30 overflow-hidden">
                  <div className="h-full rounded-full flex items-center justify-end pr-2 text-xs font-medium text-white" style={{ width: `${w.weight * 3}%`, background: w.color }}>
                    {w.weight}%
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="glass rounded-lg p-4 font-mono text-xs">
            <div><span className="text-primary">successScore</span> = (</div>
            <div className="pl-4">projectSkillMatch * 0.30 +</div>
            <div className="pl-4">skillDiversity * 0.20 +</div>
            <div className="pl-4">experience * 0.15 +</div>
            <div className="pl-4">roleCoverage * 0.15 +</div>
            <div className="pl-4">compatibility * 0.10 +</div>
            <div className="pl-4">hackathonExperience * 0.10</div>
            <div>) * 100</div>
          </div>
          <p className="text-amber-400/80"><AlertTriangle className="inline h-4 w-4 mr-1" />This is a prediction score, not a guaranteed probability of winning.</p>
        </CardContent>
      </Card>

      {/* Recommendation Engine */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-400" />6. Recommendation Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>A <strong className="text-foreground">rule-based engine</strong> analyzes each team and generates three types of recommendations:</p>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="glass rounded-lg p-4 border-l-2 border-emerald-400">
              <h4 className="font-semibold text-emerald-400 mb-1">Strengths</h4>
              <p>Identifies areas where the team excels: strong role coverage, full skill match, balanced experience.</p>
            </div>
            <div className="glass rounded-lg p-4 border-l-2 border-amber-400">
              <h4 className="font-semibold text-amber-400 mb-1">Weaknesses</h4>
              <p>Flags gaps: missing roles, low skill coverage, no hackathon experience, low diversity.</p>
            </div>
            <div className="glass rounded-lg p-4 border-l-2 border-blue-400">
              <h4 className="font-semibold text-blue-400 mb-1">Improvements</h4>
              <p>Actionable suggestions: add a UI/UX member, swap in someone with database skills, etc.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future ML Integration */}
      <Card className="glass border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Future ML Model Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The architecture is designed so a trained ML model can replace the scoring component without changing the rest of the pipeline:</p>
          <div className="glass rounded-lg p-4 font-mono text-xs space-y-1">
            <div><span className="text-muted-foreground">// Current: explainable weighted model</span></div>
            <div><span className="text-primary">predictSuccess</span>(members, hackathon): ScoreBreakdown</div>
            <div className="pl-4 text-muted-foreground">// Returns 6 sub-scores + weighted combination</div>
            <div className="mt-2"><span className="text-muted-foreground">// Future: trained regression model</span></div>
            <div><span className="text-primary">mlPredictSuccess</span>(features): ScoreBreakdown</div>
            <div className="pl-4 text-muted-foreground">// Same interface, trained on historical hackathon data</div>
          </div>
          <p>The feature extraction and team formation modules remain unchanged - only the prediction function is swapped.</p>
        </CardContent>
      </Card>
    </div>
  );
}
