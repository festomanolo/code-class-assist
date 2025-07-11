import { useState } from 'react';
import { Users, GraduationCap, BookOpen, MessageSquare, Code, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [userType, setUserType] = useState<'student' | 'teacher' | null>(null);
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (type: 'student' | 'teacher') => {
    if (!userId.trim()) {
      toast({
        title: "ID Required",
        description: "Please enter your ID to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      localStorage.setItem('smartAssist_userType', type);
      localStorage.setItem('smartAssist_userId', userId);
      
      toast({
        title: "Login Successful",
        description: `Welcome to Smart Assistance!`,
      });
      
      // Redirect to appropriate page
      if (type === 'student') {
        window.location.href = '/student';
      } else {
        window.location.href = '/teacher';
      }
      
      setIsLoading(false);
    }, 1000);
  };

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

        {/* Login Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Choose Your Role</h2>
            <p className="text-muted-foreground">Select whether you're a student or teacher to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Student Login */}
            <Card className={`smart-card cursor-pointer transition-all duration-300 ${
              userType === 'student' ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
            }`} onClick={() => setUserType('student')}>
              <CardHeader className="text-center">
                <div className="mx-auto p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Student Portal</CardTitle>
                <CardDescription>
                  Access tutorials, submit code exercises, and get help from teachers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-id">Student ID</Label>
                  <Input
                    id="student-id"
                    placeholder="Enter your student ID (e.g., S001)"
                    value={userType === 'student' ? userId : ''}
                    onChange={(e) => {
                      if (userType === 'student') setUserId(e.target.value);
                    }}
                    className="smart-input"
                  />
                </div>
                <Button 
                  className="w-full smart-button-primary"
                  onClick={() => handleLogin('student')}
                  disabled={isLoading || userType !== 'student' || !userId.trim()}
                >
                  {isLoading && userType === 'student' ? 'Logging in...' : 'Enter as Student'}
                </Button>
              </CardContent>
            </Card>

            {/* Teacher Login */}
            <Card className={`smart-card cursor-pointer transition-all duration-300 ${
              userType === 'teacher' ? 'ring-2 ring-accent shadow-lg' : 'hover:shadow-md'
            }`} onClick={() => setUserType('teacher')}>
              <CardHeader className="text-center">
                <div className="mx-auto p-4 bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <GraduationCap className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-xl">Teacher Dashboard</CardTitle>
                <CardDescription>
                  Monitor student progress, respond to help requests, and track learning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-id">Teacher ID</Label>
                  <Input
                    id="teacher-id"
                    placeholder="Enter your teacher ID (e.g., T001)"
                    value={userType === 'teacher' ? userId : ''}
                    onChange={(e) => {
                      if (userType === 'teacher') setUserId(e.target.value);
                    }}
                    className="smart-input"
                  />
                </div>
                <Button 
                  className="w-full smart-button-accent"
                  onClick={() => handleLogin('teacher')}
                  disabled={isLoading || userType !== 'teacher' || !userId.trim()}
                >
                  {isLoading && userType === 'teacher' ? 'Logging in...' : 'Enter as Teacher'}
                </Button>
              </CardContent>
            </Card>
          </div>
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