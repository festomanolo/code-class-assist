import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, MessageSquare, Code, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/services/supabaseService';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await supabaseService.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role: string) => {
    if (role === 'student') {
      navigate('/student');
    } else {
      navigate('/teacher');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Interactive Tutorials",
      description: "Step-by-step coding tutorials with real-time progress tracking"
    },
    {
      icon: <Code className="h-8 w-8 text-accent" />,
      title: "Live Code Sharing",
      description: "Automatic code snapshots sent to teachers for instant feedback"
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-success" />,
      title: "Real-time Help System",
      description: "Instant messaging between students and teachers"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-warning" />,
      title: "Progress Monitoring",
      description: "Teachers can track all students' progress in real-time"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary rounded-xl shadow-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Smart Assistance
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time teaching support tool for coding classes. Connect teachers and students 
            for seamless learning experiences.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="smart-card hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Welcome Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="smart-card">
            <CardHeader className="text-center">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">
                    Welcome, {profile?.name}!
                  </CardTitle>
                  <CardDescription>
                    {profile?.user_type === 'student' 
                      ? `Student ID: ${profile.student_id}`
                      : 'Teacher Dashboard'
                    }
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {profile?.user_type === 'student' && (
                  <Card 
                    className="smart-card cursor-pointer hover:shadow-md transition-all duration-300"
                    onClick={() => handleRoleSelection('student')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">Continue Learning</h3>
                      <p className="text-sm text-muted-foreground">
                        Access your tutorials and continue your coding journey
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {profile?.user_type === 'teacher' && (
                  <Card 
                    className="smart-card cursor-pointer hover:shadow-md transition-all duration-300"
                    onClick={() => handleRoleSelection('teacher')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto p-4 bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <GraduationCap className="h-8 w-8 text-accent" />
                      </div>
                      <h3 className="font-semibold mb-2">Teacher Dashboard</h3>
                      <p className="text-sm text-muted-foreground">
                        Monitor students, respond to help requests, and track progress
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="smart-card">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto p-4 bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <BookOpen className="h-8 w-8 text-secondary" />
                    </div>
                    <h3 className="font-semibold mb-2">Documentation</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn more about using Smart Assistance effectively
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-muted-foreground">
          <p className="text-sm">
            Smart Assistance - Empowering education through technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;