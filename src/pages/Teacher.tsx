import { useState, useEffect } from 'react';
import { Users, Code, MessageSquare, Send, LogOut, Filter, RefreshCw, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabaseService, type Profile, type HelpRequest, type CodeLog, type StudentProgress, type Tutorial } from '@/services/supabaseService';
import { supabase } from '@/integrations/supabase/client';

interface StudentDashboardData {
  student: Profile;
  progress: StudentProgress | null;
  tutorial: Tutorial | null;
  latestCode: CodeLog | null;
  helpRequests: HelpRequest[];
}

const Teacher = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData[]>([]);
  const [filterTutorial, setFilterTutorial] = useState<string>('all');
  const [filterStep, setFilterStep] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState<CodeLog | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [respondingToRequest, setRespondingToRequest] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
    loadInitialData();
    
    // Set up real-time subscriptions
    const subscription = supabaseService.subscribeToTeacherData((payload) => {
      setLastUpdate(new Date());
      loadDashboardData();
    });
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const userProfile = await supabaseService.getProfile();
      if (!userProfile || userProfile.user_type !== 'teacher') {
        window.location.href = '/auth';
        return;
      }
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      window.location.href = '/auth';
    }
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [allProfiles, tutorialsData] = await Promise.all([
        supabaseService.getAllProfiles(),
        supabaseService.getTutorials()
      ]);
      
      // Filter only students
      const studentsData = allProfiles.filter(p => p.user_type === 'student');
      setStudents(studentsData);
      setTutorials(tutorialsData);
      
      await loadDashboardData();
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load initial data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [allProfiles, tutorialsData, allProgress, allCodeLogs, allHelpRequests] = await Promise.all([
        supabaseService.getAllProfiles(),
        supabaseService.getTutorials(),
        supabaseService.getAllStudentProgress(),
        supabaseService.getLatestCodeLogs(),
        supabaseService.getHelpRequests()
      ]);

      // Filter only students
      const studentsData = allProfiles.filter(p => p.user_type === 'student');

      const dashboardEntries: StudentDashboardData[] = studentsData.map(student => {
        const progress = allProgress.find(p => p.student_id === student.user_id) || null;
        const tutorial = progress ? tutorialsData.find(t => t.id === progress.tutorial_id) || null : null;
        const latestCode = allCodeLogs[student.user_id] || null;
        const helpRequests = allHelpRequests.filter(req => req.student_id === student.user_id);

        return {
          student,
          progress,
          tutorial,
          latestCode,
          helpRequests
        };
      });

      setDashboardData(dashboardEntries);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleRespondToHelpRequest = async (requestId: string) => {
    if (!responseMessage.trim()) {
      toast({
        title: "Response Required",
        description: "Please enter a response message",
        variant: "destructive"
      });
      return;
    }

    try {
      await supabaseService.respondToHelpRequest(requestId, responseMessage);
      setResponseMessage('');
      setRespondingToRequest(null);
      await loadDashboardData();
      
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the student",
      });
    } catch (error) {
      toast({
        title: "Failed to Send Response",
        description: "Could not send response",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filteredData = dashboardData.filter(data => {
    if (filterTutorial !== 'all' && data.progress?.tutorial_id !== filterTutorial) {
      return false;
    }
    if (filterStep !== 'all' && data.progress?.current_step.toString() !== filterStep) {
      return false;
    }
    return true;
  });

  const getStepOptions = () => {
    const tutorial = tutorials.find(t => t.id === filterTutorial);
    if (!tutorial || !Array.isArray(tutorial.steps)) return [];
    
    return (tutorial.steps as any[]).map((_, index) => ({
      value: index.toString(),
      label: `Step ${index + 1}`
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Teacher Dashboard</h1>
              <p className="text-sm text-muted-foreground">{profile?.name || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <Button variant="outline" onClick={loadDashboardData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="smart-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="smart-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Code className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">
                    {dashboardData.filter(d => d.latestCode).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Coders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="smart-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">
                    {dashboardData.reduce((sum, d) => sum + d.helpRequests.filter(r => !r.response).length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="smart-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(dashboardData.reduce((sum, d) => {
                      if (!d.progress || !d.tutorial) return sum;
                      return sum + ((d.progress.current_step + 1) / (d.tutorial.steps as any[]).length);
                    }, 0) / Math.max(dashboardData.length, 1) * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="smart-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filter by Tutorial</label>
                <Select value={filterTutorial} onValueChange={setFilterTutorial}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Tutorials" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tutorials</SelectItem>
                    {tutorials.map(tutorial => (
                      <SelectItem key={tutorial.id} value={tutorial.id}>
                        {tutorial.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filter by Step</label>
                <Select 
                  value={filterStep} 
                  onValueChange={setFilterStep}
                  disabled={filterTutorial === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Steps" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Steps</SelectItem>
                    {getStepOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Dashboard */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Students ({filteredData.length})</h2>
          
          {filteredData.length === 0 ? (
            <Card className="smart-card">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No students match the current filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredData.map((data) => (
              <Card key={data.student.id} className="smart-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{data.student.name}</CardTitle>
                        <CardDescription>ID: {data.student.student_id || data.student.user_id}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.latestCode && (
                        <div className="status-online"></div>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {data.latestCode ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Progress
                      </h4>
                      {data.progress && data.tutorial ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{data.tutorial.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Step {data.progress.current_step + 1} of {(data.tutorial.steps as any[]).length}
                          </p>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((data.progress.current_step + 1) / (data.tutorial.steps as any[]).length) * 100}%` 
                              }}
                            />
                          </div>
                          <Badge className="smart-badge-primary">
                            {Math.round(((data.progress.current_step + 1) / (data.tutorial.steps as any[]).length) * 100)}% Complete
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No progress yet</p>
                      )}
                    </div>

                    {/* Latest Code */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Latest Code
                      </h4>
                      {data.latestCode ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(data.latestCode.timestamp).toLocaleTimeString()}
                          </p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View Code
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Code from {data.student.name}</DialogTitle>
                                <DialogDescription>
                                  Last updated: {new Date(data.latestCode.timestamp).toLocaleString()}
                                   {data.latestCode.is_submission && (
                                     <Badge className="ml-2 smart-badge-success">Submission</Badge>
                                   )}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-[400px] font-mono">
                                  {data.latestCode.code || 'No code available'}
                                </pre>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No code submitted yet</p>
                      )}
                    </div>

                    {/* Help Requests */}
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Help Requests
                      </h4>
                      {data.helpRequests.length > 0 ? (
                        <div className="space-y-2">
                          {data.helpRequests.slice(0, 2).map((request, index) => (
                            <div key={index} className="p-2 bg-muted rounded text-sm">
                               <p className="font-medium text-xs text-muted-foreground mb-1">
                                 {new Date(request.created_at).toLocaleTimeString()}
                               </p>
                              <p className="mb-2">{request.message}</p>
                              {request.response ? (
                                <div className="text-success">
                                  <p className="text-xs font-medium">Response sent</p>
                                </div>
                              ) : (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="smart-button-secondary">
                                      <Send className="h-3 w-3 mr-1" />
                                      Respond
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Respond to Help Request</DialogTitle>
                                       <DialogDescription>
                                         From: {data.student.name} ({data.student.student_id || data.student.user_id})
                                       </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="p-3 bg-muted rounded">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">
                                          Student's message:
                                        </p>
                                        <p>{request.message}</p>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Your response:</label>
                                        <Textarea
                                          value={responseMessage}
                                          onChange={(e) => setResponseMessage(e.target.value)}
                                          placeholder="Enter your response..."
                                          className="smart-textarea"
                                        />
                                      </div>
                                      <Button 
                                        onClick={() => handleRespondToHelpRequest(request.id)}
                                        className="w-full smart-button-primary"
                                        disabled={!responseMessage.trim()}
                                      >
                                        Send Response
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          ))}
                          {data.helpRequests.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{data.helpRequests.length - 2} more requests
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No help requests</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Teacher;