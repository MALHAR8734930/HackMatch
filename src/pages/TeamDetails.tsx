import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  ArrowLeft, Trophy, CheckCircle2, AlertTriangle, Lightbulb,
  Users, Target, Download, Shield, Star,
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  RadarChart, PolarGrid, PolarRadiusAxis, Radar,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { exportToCSV } from '../lib/export';
import { getScoreLabel } from '../lib/ai/prediction';
import type { Participant, Team, TeamScore, Recommendation } from '../lib/types';

export default function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Participant[]>([]);
  const [score, setScore] = useState<TeamScore | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!teamId) return;
      const teamIdx = parseInt(teamId, 10);

      // Try loading from DB first
      const { data: teamsData } = await supabase.from('teams').select('*, hackathons(*)').order('team_index', { ascending: true });
      if (teamsData && teamsData.length > teamIdx) {
        const teamRow = teamsData[teamIdx];
        setTeam(teamRow);
        setHackathon(teamRow.hackathons);

        const { data: memberRows } = await supabase
          .from('team_members')
          .select('participant_id, role')
          .eq('team_id', teamRow.id);

        if (memberRows && memberRows.length > 0) {
          const participantIds = memberRows.map((m: any) => m.participant_id);
          const { data: participantData } = await supabase
            .from('participants')
            .select('*')
            .in('id', participantIds);
          setMembers(participantData || []);
        }

        const { data: scoreData } = await supabase
          .from('team_scores')
          .select('*')
          .eq('team_id', teamRow.id)
          .maybeSingle();
        setScore(scoreData as TeamScore | null);

        const { data: recData } = await supabase
          .from('recommendations')
          .select('*')
          .eq('team_id', teamRow.id);
        setRecommendations(recData || []);
      }
      setLoading(false);
    }
    load();
  }, [teamId]);

  function handleExport() {
    if (!team || !score) return;
    const headers = ['Team Name', 'Member Name', 'Email', 'Role', 'Experience', 'Success Score', 'Project Match', 'Skill Diversity', 'Role Coverage', 'Compatibility', 'Hackathon Experience'];
    const rows = members.map(m => [
      team.name, m.full_name, m.email, m.preferred_team_role, m.experience_level,
      score.success_score, score.project_skill_match, score.skill_diversity, score.role_coverage, score.compatibility, score.hackathon_experience,
    ]);
    exportToCSV(`${team.name.replace(/\s+/g, '-').toLowerCase()}-details.csv`, headers, rows);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading team details...</div>;
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Team not found. Generate teams first.</p>
        <Link to="/teams"><Button>Go to Team Formation</Button></Link>
      </div>
    );
  }

  const scoreLabel = score ? getScoreLabel(Number(score.success_score)) : null;

  const breakdownData = score ? [
    { label: 'Project-Skill Match', value: Number(score.project_skill_match), weight: '30%' },
    { label: 'Skill Diversity', value: Number(score.skill_diversity), weight: '20%' },
    { label: 'Experience', value: Number(score.experience), weight: '15%' },
    { label: 'Role Coverage', value: Number(score.role_coverage), weight: '15%' },
    { label: 'Compatibility', value: Number(score.compatibility), weight: '10%' },
    { label: 'Hackathon Experience', value: Number(score.hackathon_experience), weight: '10%' },
  ] : [];

  // Skill coverage radar
  const allSkills = new Set<string>();
  members.forEach(m => {
    [...m.technical_skills, ...m.programming_languages, ...m.ai_ml_skills, ...m.web_dev_skills, ...m.database_skills, ...m.ui_ux_skills].forEach(s => allSkills.add(s));
  });
  const skillCategories = ['Programming', 'AI/ML', 'Web Dev', 'Database', 'UI/UX', 'Soft Skills'];
  const radarData = skillCategories.map(cat => {
    let count = 0;
    members.forEach(m => {
      if (cat === 'Programming') count += m.programming_languages.length;
      else if (cat === 'AI/ML') count += m.ai_ml_skills.length;
      else if (cat === 'Web Dev') count += m.web_dev_skills.length;
      else if (cat === 'Database') count += m.database_skills.length;
      else if (cat === 'UI/UX') count += m.ui_ux_skills.length;
      else if (cat === 'Soft Skills') count += m.soft_skills.length;
    });
    return { name: cat, skills: count };
  });

  const strengths = recommendations.filter(r => r.type === 'strength');
  const weaknesses = recommendations.filter(r => r.type === 'weakness');
  const improvements = recommendations.filter(r => r.type === 'improvement');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">{hackathon?.name || 'Hackathon'} · {hackathon?.project_domain || ''}</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Score overview */}
      {score && scoreLabel && (
        <Card className="glass border-primary/30">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`text-5xl font-bold ${scoreLabel.color}`}>
                    {Number(score.success_score).toFixed(1)}
                  </div>
                  <div>
                    <Badge variant={Number(score.success_score) >= 70 ? "default" : "secondary"}>
                      {scoreLabel.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Predicted Success Score (0-100)</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a prediction score based on an explainable weighted model, not a guaranteed probability of winning.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" />{members.length} members</Badge>
                  <Badge variant="outline" className="gap-1"><Target className="h-3 w-3" />{Number(score.project_skill_match).toFixed(0)}% skill match</Badge>
                  <Badge variant="outline" className="gap-1"><Star className="h-3 w-3" />{Number(score.role_coverage).toFixed(0)}% role coverage</Badge>
                </div>
              </div>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart innerRadius="45%" outerRadius="100%" data={[{ name: 'Score', value: Number(score.success_score), fill: 'hsl(217 91% 60%)' }]} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(224 30% 15%)' }} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="hsl(210 40% 98%)" fontSize="36" fontWeight="bold">
                      {Number(score.success_score).toFixed(0)}
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Members */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Team Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="glass rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold shrink-0">
                      {member.full_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">{member.email} · {member.college || 'N/A'}</p>
                    </div>
                    <Badge variant="secondary">{member.preferred_team_role}</Badge>
                    <Badge variant="outline">{member.experience_level}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[...member.programming_languages, ...member.ai_ml_skills, ...member.web_dev_skills, ...member.database_skills, ...member.ui_ux_skills].slice(0, 8).map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skill coverage radar */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-accent" />Skill Coverage by Category</CardTitle>
              <CardDescription>Distribution of skills across categories in the team</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(224 30% 18%)" />
                  <PolarAngleAxis dataKey="name" stroke="hsl(215 20% 65%)" fontSize={12} />
                  <PolarRadiusAxis stroke="hsl(215 20% 65%)" fontSize={10} />
                  <Radar dataKey="skills" stroke="hsl(263 70% 60%)" fill="hsl(263 70% 60%)" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: 'hsl(224 50% 8%)', border: '1px solid hsl(224 30% 18%)', borderRadius: '8px' }} labelStyle={{ color: 'hsl(210 40% 98%)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Score breakdown */}
        <div className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-400" />Success Prediction Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {breakdownData.map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label} <span className="text-primary/40">({item.weight})</span></span>
                    <span className="font-medium">{item.value.toFixed(0)}%</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-400" />AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />Strengths</h4>
                    <ul className="space-y-1.5">
                      {strengths.map((r, i) => <li key={i} className="text-sm text-muted-foreground pl-5">{r.content}</li>)}
                    </ul>
                  </div>
                )}
                {weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Weaknesses</h4>
                    <ul className="space-y-1.5">
                      {weaknesses.map((r, i) => <li key={i} className="text-sm text-muted-foreground pl-5">{r.content}</li>)}
                    </ul>
                  </div>
                )}
                {improvements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-1"><Lightbulb className="h-4 w-4" />Recommended Improvements</h4>
                    <ul className="space-y-1.5">
                      {improvements.map((r, i) => <li key={i} className="text-sm text-muted-foreground pl-5">{r.content}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
