import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Users, Trophy, TrendingUp, Target, ArrowRight, Brain, Award,
  Zap, UserCheck, BarChart3, Download, Sparkles, Send, Table2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Participant } from '../lib/types';

const CHART_COLORS = ['hsl(217 91% 60%)', 'hsl(263 70% 60%)', 'hsl(172 67% 45%)', 'hsl(43 90% 60%)', 'hsl(340 75% 55%)'];
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export default function Dashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiMode, setAiMode] = useState<'copilot' | 'pandas'>('copilot');
  const [aiQuestion, setAiQuestion] = useState('Which skills should we strengthen across the teams?');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('participants').select('*');
      const { data: t } = await supabase.from('teams').select('*, hackathons(name)');
      const teamIds = (t || []).map((team: any) => team.id);
      let scoresData: any[] = [];
      if (teamIds.length > 0) {
        const { data: s } = await supabase.from('team_scores').select('*').in('team_id', teamIds);
        scoresData = s || [];
      }
      setParticipants(p || []);
      setTeams(t || []);
      setScores(scoresData);
      setLoading(false);
    }
    load();
  }, []);

  // Compute stats
  const totalParticipants = participants.length;
  const totalTeams = teams.length;
  const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + Number(s.success_score), 0) / scores.length : 0;
  const highestTeam = scores.length > 0 ? scores.reduce((max, s) => Number(s.success_score) > Number(max.success_score) ? s : max) : null;
  const highestTeamName = highestTeam ? teams.find(t => t.id === highestTeam.team_id)?.name || 'N/A' : 'N/A';

  // Skill distribution
  const skillCounts: Record<string, number> = {};
  participants.forEach(p => {
    [...p.technical_skills, ...p.programming_languages, ...p.ai_ml_skills, ...p.web_dev_skills, ...p.database_skills, ...p.ui_ux_skills].forEach(s => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

  // Experience distribution
  const expCounts: Record<string, number> = { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 };
  participants.forEach(p => { expCounts[p.experience_level] = (expCounts[p.experience_level] || 0) + 1; });
  const expData = Object.entries(expCounts).map(([name, value]) => ({ name, value }));

  // Role distribution
  const roleCounts: Record<string, number> = {};
  participants.forEach(p => { roleCounts[p.preferred_team_role] = (roleCounts[p.preferred_team_role] || 0) + 1; });
  const roleData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

  // Team scores
  const teamScoreData = scores.map(s => {
    const team = teams.find(t => t.id === s.team_id);
    return { name: team?.name || 'Unknown', score: Number(s.success_score) };
  }).sort((a, b) => b.score - a.score);

  async function askAi() {
    setAiLoading(true);
    setAiError('');
    setAiAnswer('');
    const endpoint = aiMode === 'copilot' ? '/api/ai/copilot' : '/api/ai/analyze';
    const context = {
      participants: totalParticipants,
      teams: totalTeams,
      average_success_score: Number(avgScore.toFixed(1)),
      top_skills: topSkills.slice(0, 5),
    };
    try {
      let response: Response;
      try {
        response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: aiQuestion, ...(aiMode === 'copilot' ? { context } : {}) }),
        });
      } catch {
        throw new Error('The AI backend is offline. Start FastAPI on port 8000 and try again.');
      }
      let payload: { answer?: unknown; detail?: string } = {};
      try {
        payload = await response.json();
      } catch {
        if (!response.ok) {
          throw new Error('The AI backend is offline. Start FastAPI on port 8000 and try again.');
        }
        throw new Error(`The AI backend returned an invalid response (${response.status}).`);
      }
      if (!response.ok) throw new Error(payload.detail || 'The AI service is unavailable.');
      setAiAnswer(String(payload.answer));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'The AI service is unavailable.');
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of participants, teams, and AI predictions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`${BACKEND_URL}/api/tableau/participants.csv`} download>
              <Download className="mr-2 h-4 w-4" />
              Tableau Participants
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`${BACKEND_URL}/api/tableau/teams.csv`} download>
              <Download className="mr-2 h-4 w-4" />
              Tableau Teams
            </a>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-cyan-400/30 bg-cyan-400/[0.04]">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-cyan-300" /> AI Studio
              </CardTitle>
              <CardDescription>Ask Copilot or PandasAI about your participant data.</CardDescription>
            </div>
            <div className="flex rounded-lg border border-border/70 bg-background/60 p-1">
              {(['copilot', 'pandas'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAiMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${aiMode === mode ? 'bg-cyan-300 text-slate-950' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {mode === 'copilot' ? 'Copilot AI' : 'PandasAI'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              value={aiQuestion}
              onChange={event => setAiQuestion(event.target.value)}
              rows={2}
              className="min-h-20 flex-1 resize-none rounded-lg border border-border bg-background/70 px-3 py-2 text-sm outline-none transition focus:border-cyan-300 focus:ring-1 focus:ring-cyan-300"
              placeholder="Ask a question about your hackathon data..."
            />
            <Button onClick={askAi} disabled={aiLoading || !aiQuestion.trim()} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200 sm:self-end">
              <Send className="mr-2 h-4 w-4" /> {aiLoading ? 'Thinking...' : 'Ask AI'}
            </Button>
          </div>
          {aiAnswer && <div className="rounded-lg border border-cyan-300/20 bg-background/50 p-3 text-sm leading-6 whitespace-pre-wrap">{aiAnswer}</div>}
          {aiError && <p className="text-sm text-amber-300">{aiError}</p>}
          <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <Table2 className="h-4 w-4 text-lime-300" /> Tableau-ready exports:
            <a className="text-cyan-300 hover:underline" href={`${BACKEND_URL}/api/tableau/participants.csv`} download>Participants CSV</a>
            <a className="text-cyan-300 hover:underline" href={`${BACKEND_URL}/api/tableau/teams.csv`} download>Teams CSV</a>
            <a className="text-cyan-300 hover:underline" href={`${BACKEND_URL}/api/tableau/summary`} target="_blank" rel="noreferrer">Summary JSON</a>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Participants', value: totalParticipants, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Total Teams', value: totalTeams, icon: Trophy, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Average Team Score', value: avgScore > 0 ? avgScore.toFixed(1) : 'N/A', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Highest Scoring Team', value: highestTeamName, icon: Award, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map((stat, i) => (
          <Card key={i} className="glass border-border/50 hover:border-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/hackathon">
          <Card className="glass border-border/50 hover:border-primary/30 transition-all group cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Create Hackathon</p>
                <p className="text-xs text-muted-foreground">Set up a new event</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/teams">
          <Card className="glass border-border/50 hover:border-primary/30 transition-all group cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Generate Teams</p>
                <p className="text-xs text-muted-foreground">AI-powered formation</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/participants">
          <Card className="glass border-border/50 hover:border-primary/30 transition-all group cursor-pointer h-full">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">View Participants</p>
                <p className="text-xs text-muted-foreground">{totalParticipants} registered</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skill distribution */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Skill Distribution
            </CardTitle>
            <CardDescription>Top 10 most common skills across participants</CardDescription>
          </CardHeader>
          <CardContent>
            {topSkills.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSkills} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="hsl(215 20% 65%)" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(215 20% 65%)" fontSize={11} width={100} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(224 50% 8%)', border: '1px solid hsl(224 30% 18%)', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(210 40% 98%)' }}
                  />
                  <Bar dataKey="count" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">No skill data available</p>}
          </CardContent>
        </Card>

        {/* Team success scores */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Team Success Scores
            </CardTitle>
            <CardDescription>Predicted success score per team (0-100)</CardDescription>
          </CardHeader>
          <CardContent>
            {teamScoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamScoreData}>
                  <XAxis dataKey="name" stroke="hsl(215 20% 65%)" fontSize={11} angle={-20} textAnchor="end" height={60} />
                  <YAxis stroke="hsl(215 20% 65%)" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(224 50% 8%)', border: '1px solid hsl(224 30% 18%)', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(210 40% 98%)' }}
                  />
                  <Bar dataKey="score" fill="hsl(263 70% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">Generate teams to see scores</p>}
          </CardContent>
        </Card>

        {/* Experience distribution */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Experience Distribution
            </CardTitle>
            <CardDescription>Participant experience levels</CardDescription>
          </CardHeader>
          <CardContent>
            {expData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3}>
                    {expData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(224 50% 8%)', border: '1px solid hsl(224 30% 18%)', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(210 40% 98%)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">No experience data</p>}
          </CardContent>
        </Card>

        {/* Role distribution */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-400" />
              Role Distribution
            </CardTitle>
            <CardDescription>Preferred team roles</CardDescription>
          </CardHeader>
          <CardContent>
            {roleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={roleData}>
                  <PolarGrid stroke="hsl(224 30% 18%)" />
                  <PolarAngleAxis dataKey="name" stroke="hsl(215 20% 65%)" fontSize={11} />
                  <PolarRadiusAxis stroke="hsl(215 20% 65%)" fontSize={10} />
                  <Radar dataKey="value" stroke="hsl(217 91% 60%)" fill="hsl(217 91% 60%)" fillOpacity={0.3} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(224 50% 8%)', border: '1px solid hsl(224 30% 18%)', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(210 40% 98%)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">No role data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Highest scoring team highlight */}
      {highestTeam && (
        <Card className="glass border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              Highest Scoring Team: {highestTeamName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-5xl font-bold gradient-text mb-2">{Number(highestTeam.success_score).toFixed(1)}</div>
                <div className="text-sm text-muted-foreground mb-4">Predicted Success Score</div>
                {[
                  { label: 'Project-Skill Match', value: Number(highestTeam.project_skill_match) },
                  { label: 'Skill Diversity', value: Number(highestTeam.skill_diversity) },
                  { label: 'Experience', value: Number(highestTeam.experience) },
                  { label: 'Role Coverage', value: Number(highestTeam.role_coverage) },
                  { label: 'Compatibility', value: Number(highestTeam.compatibility) },
                  { label: 'Hackathon Experience', value: Number(highestTeam.hackathon_experience) },
                ].map(item => (
                  <div key={item.label} className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value.toFixed(0)}%</span>
                    </div>
                    <Progress value={item.value} className="h-1.5" />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <RadialBarChart innerRadius="40%" outerRadius="100%" data={[{ name: 'Score', value: Number(highestTeam.success_score), fill: 'hsl(217 91% 60%)' }]} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(224 30% 15%)' }} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="hsl(210 40% 98%)" fontSize="32" fontWeight="bold">
                      {Number(highestTeam.success_score).toFixed(0)}
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
