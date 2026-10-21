import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { CalendarPlus, Plus, X, Users, Target, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/use-auth';
import type { ExperienceLevel } from '../lib/types';

const DOMAINS = ['Healthcare', 'FinTech', 'Cybersecurity', 'EdTech', 'Sustainability', 'Agriculture', 'Smart Cities', 'Generative AI'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SKILL_OPTIONS = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'TensorFlow', 'PyTorch', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Figma', 'Deep Learning', 'LLMs', 'Computer Vision', 'NLP', 'GraphQL', 'FastAPI', 'Tailwind CSS', 'Redis'];

export default function HackathonSetup() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [numParticipants, setNumParticipants] = useState(30);
  const [teamSize, setTeamSize] = useState(4);
  const [domain, setDomain] = useState('Generative AI');
  const [difficulty, setDifficulty] = useState<ExperienceLevel>('Intermediate');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Python', 'React']);
  const [optionalSkills, setOptionalSkills] = useState<string[]>(['TensorFlow', 'PostgreSQL']);
  const [skillInput, setSkillInput] = useState('');
  const [optionalInput, setOptionalInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingHackathons, setExistingHackathons] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('hackathons').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setExistingHackathons(data || []);
    });
  }, []);

  const numTeams = Math.ceil(numParticipants / teamSize);

  function addRequiredSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
    }
    setSkillInput('');
  }

  function addOptionalSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !optionalSkills.includes(trimmed)) {
      setOptionalSkills([...optionalSkills, trimmed]);
    }
    setOptionalInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('hackathons')
        .insert({
          name,
          num_participants: numParticipants,
          team_size: teamSize,
          project_domain: domain,
          required_skills: requiredSkills,
          optional_skills: optionalSkills,
          difficulty_level: difficulty,
          num_teams: numTeams,
          created_by: profile?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success(`Hackathon "${name}" created! ${numTeams} teams will be generated.`);
      navigate('/teams');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create hackathon');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <CalendarPlus className="h-8 w-8 text-primary" />
          Hackathon Setup
        </h1>
        <p className="text-muted-foreground">Configure your hackathon event. The AI will use these settings to form optimal teams.</p>
      </div>

      {/* Existing hackathons */}
      {existingHackathons.length > 0 && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Hackathons</CardTitle>
            <CardDescription>Click to view teams from a previous hackathon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {existingHackathons.slice(0, 3).map(h => (
                <div key={h.id} className="flex items-center justify-between glass rounded-lg p-3">
                  <div>
                    <p className="font-medium">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.project_domain} · {h.num_participants} participants · {h.num_teams} teams</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/teams')}>View Teams</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hackathon Name *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="AI Innovation Challenge 2026" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numParticipants">Number of Participants</Label>
                <Input id="numParticipants" type="number" min={2} max={100} value={numParticipants} onChange={e => setNumParticipants(parseInt(e.target.value) || 1)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Desired Team Size</Label>
                <Input id="teamSize" type="number" min={2} max={8} value={teamSize} onChange={e => setTeamSize(parseInt(e.target.value) || 1)} />
              </div>
              <div className="space-y-2">
                <Label>Number of Teams</Label>
                <div className="flex h-10 items-center px-4 rounded-md glass text-muted-foreground">
                  {numTeams} (auto-calculated)
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Domain</Label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as ExperienceLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(lvl => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Project Requirements</CardTitle>
            <CardDescription>Define the skills your hackathon projects require and optionally prefer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRequiredSkill(skillInput); } }}
                  placeholder="Add required skill..."
                />
                <Button type="button" variant="outline" size="icon" onClick={() => addRequiredSkill(skillInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requiredSkills.map(skill => (
                    <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                      {skill}
                      <button type="button" onClick={() => setRequiredSkills(requiredSkills.filter(s => s !== skill))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {SKILL_OPTIONS.filter(s => !requiredSkills.includes(s)).slice(0, 8).map(s => (
                  <button key={s} type="button" onClick={() => addRequiredSkill(s)}
                    className="text-xs px-2 py-1 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Optional Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={optionalInput}
                  onChange={e => setOptionalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOptionalSkill(optionalInput); } }}
                  placeholder="Add optional skill..."
                />
                <Button type="button" variant="outline" size="icon" onClick={() => addOptionalSkill(optionalInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {optionalSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {optionalSkills.map(skill => (
                    <Badge key={skill} variant="outline" className="gap-1 pr-1">
                      {skill}
                      <button type="button" onClick={() => setOptionalSkills(optionalSkills.filter(s => s !== skill))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="glass border-primary/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{numParticipants}</div>
                <div className="text-xs text-muted-foreground">Participants</div>
              </div>
              <div>
                <Target className="h-6 w-6 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold">{teamSize}</div>
                <div className="text-xs text-muted-foreground">Per Team</div>
              </div>
              <div>
                <Trophy className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{numTeams}</div>
                <div className="text-xs text-muted-foreground">Teams</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={loading || !name}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          {loading ? 'Creating...' : 'Create Hackathon & Generate Teams'}
        </Button>
      </form>
    </div>
  );
}
