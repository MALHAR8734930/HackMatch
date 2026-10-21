import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Users, Search, Download, UserPlus, Mail, GraduationCap,
  Briefcase, Award, Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportToCSV } from '../lib/export';
import { toast } from 'sonner';
import type { Participant } from '../lib/types';

export default function ParticipantsList() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
      setParticipants(data as Participant[] || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = participants.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.college.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.preferred_team_role === roleFilter;
    return matchesSearch && matchesRole;
  });

  function handleExport() {
    const headers = ['Name', 'Email', 'College', 'Department', 'Year', 'Experience Level', 'Preferred Role', 'Previous Hackathon Exp', 'Technical Skills', 'Programming', 'AI/ML Skills', 'Web Dev', 'Database', 'UI/UX', 'Soft Skills', 'Interests'];
    const rows = filtered.map(p => [
      p.full_name, p.email, p.college, p.department, p.year, p.experience_level, p.preferred_team_role, p.previous_hackathon_experience,
      p.technical_skills.join('; '), p.programming_languages.join('; '), p.ai_ml_skills.join('; '),
      p.web_dev_skills.join('; '), p.database_skills.join('; '), p.ui_ux_skills.join('; '),
      p.soft_skills.join('; '), p.areas_of_interest.join('; '),
    ]);
    exportToCSV('hackmatch-participants.csv', headers, rows);
    toast.success(`Exported ${filtered.length} participants as CSV`);
  }

  const roles = ['AI/ML', 'Backend', 'Frontend', 'UI/UX', 'Database', 'Research', 'Presentation', 'Project Management'];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Loading participants...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Participants
          </h1>
          <p className="text-muted-foreground">{participants.length} registered participants</p>
        </div>
        <div className="flex gap-2">
          <Link to="/register"><Button variant="outline"><UserPlus className="h-4 w-4 mr-2" />Add Participant</Button></Link>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or college..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setRoleFilter('all')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${roleFilter === 'all' ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
            {roles.map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${roleFilter === r ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Participant cards */}
      {filtered.length === 0 ? (
        <Card className="glass border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Participants Found</h3>
            <p className="text-muted-foreground mb-6">
              {search || roleFilter !== 'all' ? 'No participants match your filters.' : 'Register participants to get started.'}
            </p>
            <Link to="/register"><Button><UserPlus className="h-4 w-4 mr-2" />Register Participant</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(p => (
            <Card key={p.id} className="glass border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold shrink-0">
                    {p.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{p.full_name}</h3>
                      {p.is_demo && <Badge variant="outline" className="text-xs">Demo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" />{p.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {p.college && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />{p.college}
                    </div>
                  )}
                  {p.department && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="h-3 w-3" />{p.department}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Award className="h-3 w-3" />{p.experience_level}
                  </div>
                  <div className="text-muted-foreground">{p.year || 'N/A'}</div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary">{p.preferred_team_role}</Badge>
                  <Badge variant="outline">{p.previous_hackathon_experience}</Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[...p.programming_languages, ...p.ai_ml_skills, ...p.web_dev_skills].slice(0, 5).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">{s}</span>
                  ))}
                  {[...p.programming_languages, ...p.ai_ml_skills, ...p.web_dev_skills].length > 5 && (
                    <span className="text-xs px-2 py-0.5 text-muted-foreground">
                      +{[...p.programming_languages, ...p.ai_ml_skills, ...p.web_dev_skills].length - 5} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
