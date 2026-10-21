import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Trophy, RefreshCw, Lock, Unlock, ArrowRight, Download, Brain, Sparkles,
  CheckCircle2, AlertTriangle, Lightbulb, Users, Target, TrendingUp, X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { generateAllTeams, type GeneratedTeam } from '../lib/ai';
import { exportToCSV } from '../lib/export';
import { getScoreLabel } from '../lib/ai/prediction';
import type { Participant, Hackathon } from '../lib/types';

export default function TeamFormation() {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<GeneratedTeam[]>([]);
  const [lockedTeams, setLockedTeams] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [swapDialog, setSwapDialog] = useState<{ fromTeam: number; participantId: string } | null>(null);
  const [swapTarget, setSwapTarget] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const { data: participantData } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: hackathonData } = await supabase
      .from('hackathons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (participantData) setParticipants(participantData as Participant[]);
    if (hackathonData) setHackathon(hackathonData as Hackathon);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleGenerate() {
    if (!hackathon) {
      toast.error('Please create a hackathon first');
      navigate('/hackathon');
      return;
    }
    if (participants.length === 0) {
      toast.error('No participants found. Register participants first.');
      return;
    }

    setGenerating(true);
    // Simulate AI processing for UX feedback
    await new Promise(r => setTimeout(r, 1500));

    const generated = generateAllTeams(participants, hackathon);
    setTeams(generated);
    setHasGenerated(true);
    setGenerating(false);

    // Save to database
    try {
      // Clear old teams for this hackathon
      await supabase.from('team_members').delete().in('team_id',
        (await supabase.from('teams').select('id').eq('hackathon_id', hackathon.id)).data?.map((t: any) => t.id) || []
      );
      await supabase.from('teams').delete().eq('hackathon_id', hackathon.id);

      for (const team of generated) {
        const { data: teamRow } = await supabase.from('teams').insert({
          hackathon_id: hackathon.id,
          name: team.name,
          team_index: team.index,
          locked: false,
        }).select().single();

        if (teamRow) {
          await supabase.from('team_members').insert(
            team.members.map(m => ({ team_id: teamRow.id, participant_id: m.id, role: m.preferred_team_role }))
          );
          await supabase.from('team_scores').insert({
            team_id: teamRow.id,
            success_score: team.score.success_score,
            project_skill_match: team.score.project_skill_match,
            skill_diversity: team.score.skill_diversity,
            experience: team.score.experience,
            role_coverage: team.score.role_coverage,
            compatibility: team.score.compatibility,
            hackathon_experience: team.score.hackathon_experience,
          });
          await supabase.from('recommendations').insert([
            ...team.recommendations.strengths.map(c => ({ team_id: teamRow.id, type: 'strength', content: c })),
            ...team.recommendations.weaknesses.map(c => ({ team_id: teamRow.id, type: 'weakness', content: c })),
            ...team.recommendations.improvements.map(c => ({ team_id: teamRow.id, type: 'improvement', content: c })),
          ]);
        }
      }
      toast.success(`Generated ${generated.length} balanced teams with AI-powered predictions!`);
    } catch (err) {
      console.error('Save error:', err);
    }
  }

  function handleRegenerate() {
    setGenerating(true);
    setTimeout(() => {
      if (hackathon && participants.length > 0) {
        const generated = generateAllTeams(participants, hackathon);
        setTeams(generated);
        setGenerating(false);
        toast.success('Teams regenerated with new AI optimization!');
      }
    }, 1500);
  }

  function handleLockTeam(idx: number) {
    setLockedTeams(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        toast.success(`Team ${teams[idx].name} unlocked`);
      } else {
        next.add(idx);
        toast.success(`Team ${teams[idx].name} locked`);
      }
      return next;
    });
  }

  function handleSwapOpen(fromTeam: number, participantId: string) {
    if (lockedTeams.has(fromTeam)) {
      toast.error('Cannot swap from a locked team. Unlock it first.');
      return;
    }
    setSwapDialog({ fromTeam, participantId });
  }

  function handleSwapExecute() {
    if (!swapDialog || swapTarget === null) return;
    const fromIdx = swapDialog.fromTeam;
    const toIdx = swapTarget;
    if (lockedTeams.has(toIdx)) {
      toast.error('Cannot swap into a locked team. Unlock it first.');
      return;
    }

    setTeams(prev => {
      const newTeams = prev.map(t => ({ ...t, members: [...t.members] }));
      const fromTeam = newTeams[fromIdx];
      const toTeam = newTeams[toIdx];
      const memberIdx = fromTeam.members.findIndex(m => m.id === swapDialog.participantId);
      if (memberIdx === -1) return prev;
      const [swapped] = fromTeam.members.splice(memberIdx, 1);
      toTeam.members.push(swapped);
      return newTeams;
    });
    toast.success('Member swapped successfully');
    setSwapDialog(null);
    setSwapTarget(null);
  }

  function handleExport() {
    const headers = ['Team Name', 'Member Name', 'Email', 'Role', 'Experience', 'Success Score', 'Project Match', 'Skill Diversity', 'Role Coverage', 'Compatibility'];
    const rows: (string | number)[][] = [];
    teams.forEach(team => {
      team.members.forEach(m => {
        rows.push([
          team.name, m.full_name, m.email, m.preferred_team_role, m.experience_level,
          team.score.success_score, team.score.project_skill_match, team.score.skill_diversity, team.score.role_coverage, team.score.compatibility,
        ]);
      });
    });
    exportToCSV('hackmatch-teams.csv', headers, rows);
    toast.success('Teams exported as CSV');
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <Brain className="h-20 w-20 text-primary animate-pulse" />
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
        </div>
        <h2 className="text-2xl font-bold mt-8 mb-2">AI is forming teams...</h2>
        <p className="text-muted-foreground">Analyzing skills, computing compatibility, and optimizing team composition</p>
        <div className="mt-6 flex gap-2">
          {['Feature Extraction', 'Skill Encoding', 'Team Formation', 'Success Prediction'].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              <span className="text-xs text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            AI Team Formation
          </h1>
          <p className="text-muted-foreground">
            {hackathon ? `${hackathon.name} · ${hackathon.project_domain} · ${participants.length} participants` : 'Loading...'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!hasGenerated ? (
            <Button onClick={handleGenerate} size="lg" className="group">
              <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
              Generate Teams
            </Button>
          ) : (
            <>
              <Button onClick={handleRegenerate} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {/* AI Pipeline visualization */}
      {!hasGenerated && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Prediction Pipeline
            </CardTitle>
            <CardDescription>The algorithm follows this pipeline to form and evaluate teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              {['Participant Data', 'Feature Extraction', 'Skill Encoding', 'Team Formation', 'Feature Calculation', 'Success Prediction', 'Recommendation'].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="glass rounded-lg px-3 py-2 text-sm">
                    <span className="text-primary/60 font-mono text-xs mr-1">{i + 1}</span>
                    {step}
                  </div>
                  {i < 6 && <ArrowRight className="h-4 w-4 text-primary/30" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams */}
      {hasGenerated && teams.length > 0 && (
        <div className="space-y-4">
          {teams.map((team, idx) => {
            const scoreLabel = getScoreLabel(team.score.success_score);
            return (
              <Card key={idx} className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Team info */}
                    <div className="lg:w-2/3 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold">{team.name}</h3>
                            <Badge variant={team.score.success_score >= 70 ? "default" : "secondary"}>
                              {scoreLabel.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {team.members.length} members · {team.skillCoverage.toFixed(0)}% skill coverage
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${scoreLabel.color}`}>
                            {team.score.success_score.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">Success Score</div>
                        </div>
                      </div>

                      {/* Members */}
                      <div className="space-y-2">
                        {team.members.map(member => (
                          <div key={member.id} className="flex items-center gap-3 glass rounded-lg p-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm shrink-0">
                              {member.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.preferred_team_role} · {member.experience_level}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                              {[...member.ai_ml_skills, ...member.web_dev_skills, ...member.programming_languages].slice(0, 3).map(s => (
                                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                            {lockedTeams.has(idx) ? null : (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0" onClick={() => handleSwapOpen(idx, member.id)}>
                                Swap
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-2">
                        {team.recommendations.strengths.slice(0, 2).map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{s}</span>
                          </div>
                        ))}
                        {team.recommendations.weaknesses.slice(0, 1).map((w, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{w}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/teams/${idx}`)}>
                          View Details
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleLockTeam(idx)}>
                          {lockedTeams.has(idx) ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                          {lockedTeams.has(idx) ? 'Unlock' : 'Lock'}
                        </Button>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="lg:w-1/3 space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Score Breakdown</h4>
                      {[
                        { label: 'Project-Skill Match', value: team.score.project_skill_match, weight: '30%' },
                        { label: 'Skill Diversity', value: team.score.skill_diversity, weight: '20%' },
                        { label: 'Experience', value: team.score.experience, weight: '15%' },
                        { label: 'Role Coverage', value: team.score.role_coverage, weight: '15%' },
                        { label: 'Compatibility', value: team.score.compatibility, weight: '10%' },
                        { label: 'Hackathon Exp.', value: team.score.hackathon_experience, weight: '10%' },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{item.label} <span className="text-primary/40">({item.weight})</span></span>
                            <span className="font-medium">{item.value.toFixed(0)}%</span>
                          </div>
                          <Progress value={item.value} className="h-1.5" />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                        Note: This is a prediction score, not a guaranteed probability of winning.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!hasGenerated && participants.length > 0 && (
        <Card className="glass border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6 animate-float">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Generate Teams</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {participants.length} participants are registered. Click "Generate Teams" to let the AI algorithm form balanced teams and predict success scores.
            </p>
            <Button onClick={handleGenerate} size="lg" className="group">
              <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
              Generate Teams with AI
            </Button>
          </CardContent>
        </Card>
      )}

      {participants.length === 0 && (
        <Card className="glass border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Participants Yet</h3>
            <p className="text-muted-foreground mb-6">Register participants first to generate teams.</p>
            <Link to="/register"><Button>Register Participant</Button></Link>
          </CardContent>
        </Card>
      )}

      {/* Swap Member Dialog */}
      <Dialog open={swapDialog !== null} onOpenChange={(open) => { if (!open) { setSwapDialog(null); setSwapTarget(null); } }}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Swap Member to Another Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select a target team to move this member to. The member will be removed from
              {' '}
              <span className="font-medium text-foreground">{swapDialog ? teams[swapDialog.fromTeam]?.name : ''}</span>{'.'}
            </p>
            <div className="space-y-2">
              {teams.map((t, i) => {
                if (swapDialog && i === swapDialog.fromTeam) return null;
                const isLocked = lockedTeams.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => setSwapTarget(i)}
                    className={`w-full flex items-center justify-between rounded-lg p-3 border transition-all ${
                      swapTarget === i ? 'border-primary/50 bg-primary/10' : 'border-border/50 glass hover:border-primary/30'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLocked}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.name}</span>
                      <span className="text-xs text-muted-foreground">{t.members.length} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-sm font-bold" style={{ color: getScoreLabel(t.score.success_score).color }}>
                        {t.score.success_score.toFixed(0)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSwapDialog(null); setSwapTarget(null); }}>Cancel</Button>
            <Button onClick={handleSwapExecute} disabled={swapTarget === null}>Confirm Swap</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
