import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { X, Plus, Cpu, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { ExperienceLevel, TeamRole } from '../lib/types';

const SKILL_SUGGESTIONS = {
  technical: ['Git', 'Docker', 'AWS', 'CI/CD', 'REST APIs', 'GraphQL'],
  programming: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'R'],
  ai_ml: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Deep Learning', 'LLMs', 'Computer Vision', 'NLP', 'Reinforcement Learning'],
  web_dev: ['React', 'Next.js', 'Node.js', 'Express', 'FastAPI', 'Django', 'Flask'],
  database: ['PostgreSQL', 'MongoDB', 'Supabase', 'Redis', 'MySQL', 'Firebase'],
  ui_ux: ['Figma', 'Design Systems', 'Prototyping', 'Wireframing', 'User Research', 'Tailwind CSS'],
  soft: ['Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Presentation'],
};

const INTEREST_SUGGESTIONS = ['Healthcare', 'FinTech', 'Cybersecurity', 'EdTech', 'Sustainability', 'Agriculture', 'Smart Cities', 'Generative AI', 'UI/UX Design'];

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const TEAM_ROLES: TeamRole[] = ['AI/ML', 'Backend', 'Frontend', 'UI/UX', 'Database', 'Research', 'Presentation', 'Project Management'];

export default function ParticipantRegister() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Beginner');
  const [previousHackathonExp, setPreviousHackathonExp] = useState('None');
  const [preferredRole, setPreferredRole] = useState<TeamRole>('Frontend');
  const [projectInterests, setProjectInterests] = useState<string[]>([]);

  const [skillArrays, setSkillArrays] = useState<Record<string, string[]>>({
    technical: [], programming: [], ai_ml: [], web_dev: [], database: [], ui_ux: [], soft: [],
  });
  const [interests, setInterests] = useState<string[]>([]);
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [existingParticipant, setExistingParticipant] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEmail(profile.email);
    }
    if (session?.user?.email) {
      setEmail(session.user.email);
      // Check if participant already exists
      supabase
        .from('participants')
        .select('id, full_name, college, department, year, experience_level, previous_hackathon_experience, preferred_team_role, technical_skills, programming_languages, ai_ml_skills, web_dev_skills, database_skills, ui_ux_skills, soft_skills, areas_of_interest, project_interests')
        .eq('email', session.user.email)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setExistingParticipant(data.id);
            setFullName(data.full_name);
            setCollege(data.college);
            setDepartment(data.department);
            setYear(data.year);
            setExperienceLevel(data.experience_level);
            setPreviousHackathonExp(data.previous_hackathon_experience);
            setPreferredRole(data.preferred_team_role);
            setSkillArrays({
              technical: data.technical_skills || [],
              programming: data.programming_languages || [],
              ai_ml: data.ai_ml_skills || [],
              web_dev: data.web_dev_skills || [],
              database: data.database_skills || [],
              ui_ux: data.ui_ux_skills || [],
              soft: data.soft_skills || [],
            });
            setInterests(data.areas_of_interest || []);
            setProjectInterests(data.project_interests || []);
          }
        });
    }
  }, [session, profile]);

  function addSkill(category: string, skill: string) {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setSkillArrays(prev => ({
      ...prev,
      [category]: [...new Set([...prev[category], trimmed])],
    }));
    setSkillInputs(prev => ({ ...prev, [category]: '' }));
  }

  function removeSkill(category: string, skill: string) {
    setSkillArrays(prev => ({
      ...prev,
      [category]: prev[category].filter(s => s !== skill),
    }));
  }

  function toggleInterest(interest: string) {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }

  function toggleProjectInterest(interest: string) {
    setProjectInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const participantData = {
      profile_id: profile?.id ?? null,
      full_name: fullName,
      email,
      college,
      department,
      year,
      technical_skills: skillArrays.technical,
      programming_languages: skillArrays.programming,
      ai_ml_skills: skillArrays.ai_ml,
      web_dev_skills: skillArrays.web_dev,
      database_skills: skillArrays.database,
      ui_ux_skills: skillArrays.ui_ux,
      soft_skills: skillArrays.soft,
      areas_of_interest: interests,
      experience_level: experienceLevel,
      previous_hackathon_experience: previousHackathonExp,
      preferred_team_role: preferredRole,
      project_interests: projectInterests,
      is_demo: false,
    };

    try {
      if (existingParticipant) {
        const { error } = await supabase
          .from('participants')
          .update(participantData)
          .eq('id', existingParticipant);
        if (error) throw error;
        toast.success('Profile updated successfully!');
      } else {
        const { error } = await supabase
          .from('participants')
          .insert(participantData);
        if (error) throw error;
        toast.success('Registration complete! Your profile has been saved.');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  }

  const skillCategories = [
    { key: 'technical', label: 'Technical Skills', suggestions: SKILL_SUGGESTIONS.technical },
    { key: 'programming', label: 'Programming Languages', suggestions: SKILL_SUGGESTIONS.programming },
    { key: 'ai_ml', label: 'AI/ML Skills', suggestions: SKILL_SUGGESTIONS.ai_ml },
    { key: 'web_dev', label: 'Web Development Skills', suggestions: SKILL_SUGGESTIONS.web_dev },
    { key: 'database', label: 'Database Skills', suggestions: SKILL_SUGGESTIONS.database },
    { key: 'ui_ux', label: 'UI/UX Skills', suggestions: SKILL_SUGGESTIONS.ui_ux },
    { key: 'soft', label: 'Soft Skills', suggestions: SKILL_SUGGESTIONS.soft },
  ];

  return (
    <div className="min-h-screen bg-background bg-radial-fade py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-blue">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg gradient-text">HackMatch AI</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {existingParticipant ? 'Edit Your Profile' : 'Participant Registration'}
          </h1>
          <p className="text-muted-foreground">
            Fill in your details below. Your information will be used by the AI algorithm to form balanced teams.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college">College</Label>
                  <Input id="college" value={college} onChange={e => setCollege(e.target.value)} placeholder="IIT Bombay" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" value={year} onChange={e => setYear(e.target.value)} placeholder="3rd Year" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {skillCategories.map(cat => (
                <div key={cat.key} className="space-y-2">
                  <Label>{cat.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInputs[cat.key] ?? ''}
                      onChange={e => setSkillInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(cat.key, skillInputs[cat.key] ?? '');
                        }
                      }}
                      placeholder={`Add ${cat.label.toLowerCase()}...`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addSkill(cat.key, skillInputs[cat.key] ?? '')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {skillArrays[cat.key].length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skillArrays[cat.key].map(skill => (
                        <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                          {skill}
                          <button type="button" onClick={() => removeSkill(cat.key, skill)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {cat.suggestions
                      .filter(s => !skillArrays[cat.key].includes(s))
                      .slice(0, 5)
                      .map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addSkill(cat.key, s)}
                          className="text-xs px-2 py-1 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                        >
                          + {s}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Interests & Experience */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Interests & Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Areas of Interest</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_SUGGESTIONS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        interests.includes(interest)
                          ? 'bg-primary/15 border-primary/50 text-primary'
                          : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as ExperienceLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map(lvl => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Team Role</Label>
                  <Select value={preferredRole} onValueChange={(v) => setPreferredRole(v as TeamRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEAM_ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hackExp">Previous Hackathon Experience</Label>
                <Input
                  id="hackExp"
                  value={previousHackathonExp}
                  onChange={e => setPreviousHackathonExp(e.target.value)}
                  placeholder="e.g., 2 hackathons, None, 5+ hackathons"
                />
              </div>

              <div className="space-y-2">
                <Label>Project Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {['AI Chatbots', 'Medical Diagnosis', 'Financial Analytics', 'Security Tools', 'Learning Platforms', 'Climate Tech', 'Urban Planning', 'Robotics', 'Farm Tech'].map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleProjectInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        projectInterests.includes(interest)
                          ? 'bg-accent/15 border-accent/50 text-accent'
                          : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-accent/30'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : existingParticipant ? 'Update Profile' : 'Register & Save Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
}
