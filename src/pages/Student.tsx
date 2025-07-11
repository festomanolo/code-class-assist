import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Send, Code, Book, HelpCircle, CheckCircle, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { APIService } from '@/services/api';

interface Tutorial {
  id: string;
  title: string;
  steps: string[];
}

interface StudentProgress {
  studentId: string;
  tutorialId: string;
  currentStep: number;
}

interface HelpRequest {
  studentId: string;
  message: string;
  response?: string;
  timestamp: string;
}

const Student = () => {
  const [studentId, setStudentId] = useState('');
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [codeAutoSaving, setCodeAutoSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('smartAssist_userId');
    const userType = localStorage.getItem('smartAssist_userType');
    
    if (!userId || userType !== 'student') {
      window.location.href = '/';
      return;
    }
    
    setStudentId(userId);
    loadData(userId);
    
    // Set up auto-save for code every 5 seconds
    const autoSaveInterval = setInterval(() => {
      if (currentCode.trim()) {
        autoSaveCode(userId);
      }
    }, 5000);
    
    // Set up polling for help responses every 5 seconds
    const pollInterval = setInterval(() => {
      loadHelpRequests(userId);
    }, 5000);
    
    return () => {
      clearInterval(autoSaveInterval);
      clearInterval(pollInterval);
    };
  }, [currentCode]);

  const loadData = async (userId: string) => {
    setIsLoading(true);
    try {
      // Load tutorials
      const tutorialsData = await APIService.getTutorials();
      setTutorials(tutorialsData);
      
      // Load student progress
      const progressData = await APIService.getStudentProgress(userId);
      setProgress(progressData);
      
      // Load current tutorial
      if (progressData && tutorialsData.length > 0) {
        const tutorial = tutorialsData.find(t => t.id === progressData.tutorialId) || tutorialsData[0];
        setCurrentTutorial(tutorial);
        
        // If no progress exists, create initial progress
        if (!progressData) {
          await APIService.updateStudentProgress(userId, tutorial.id, 0);
          setProgress({ studentId: userId, tutorialId: tutorial.id, currentStep: 0 });
        }
      }
      
      // Load help requests
      await loadHelpRequests(userId);
      
    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: "Failed to load tutorials and progress",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadHelpRequests = async (userId: string) => {
    try {
      const requests = await APIService.getHelpRequests(userId);
      setHelpRequests(requests);
    } catch (error) {
      console.error('Failed to load help requests:', error);
    }
  };

  const autoSaveCode = async (userId: string) => {
    setCodeAutoSaving(true);
    try {
      await APIService.saveCodeLog(userId, currentCode);
    } catch (error) {
      console.error('Failed to auto-save code:', error);
    } finally {
      setTimeout(() => setCodeAutoSaving(false), 500);
    }
  };

  const handleNextStep = async () => {
    if (!currentTutorial || !progress) return;
    
    const nextStep = progress.currentStep + 1;
    if (nextStep < currentTutorial.steps.length) {
      try {
        await APIService.updateStudentProgress(studentId, progress.tutorialId, nextStep);
        setProgress({ ...progress, currentStep: nextStep });
        toast({
          title: "Progress Saved",
          description: `Moved to step ${nextStep + 1} of ${currentTutorial.steps.length}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save progress",
          variant: "destructive"
        });
      }
    }
  };

  const handlePrevStep = async () => {
    if (!currentTutorial || !progress) return;
    
    const prevStep = progress.currentStep - 1;
    if (prevStep >= 0) {
      try {
        await APIService.updateStudentProgress(studentId, progress.tutorialId, prevStep);
        setProgress({ ...progress, currentStep: prevStep });
        toast({
          title: "Progress Updated",
          description: `Moved back to step ${prevStep + 1}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update progress",
          variant: "destructive"
        });
      }
    }
  };

  const submitCode = async () => {
    if (!currentCode.trim()) {
      toast({
        title: "No Code to Submit",
        description: "Please write some code before submitting",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await APIService.saveCodeLog(studentId, currentCode, true);
      toast({
        title: "Code Submitted",
        description: "Your code has been submitted for review",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit code",
        variant: "destructive"
      });
    }
  };

  const sendHelpRequest = async () => {
    if (!helpMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a help message",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await APIService.createHelpRequest(studentId, helpMessage);
      setHelpMessage('');
      await loadHelpRequests(studentId);
      toast({
        title: "Help Request Sent",
        description: "Your teacher will respond soon",
      });
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: "Could not send help request",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smartAssist_userType');
    localStorage.removeItem('smartAssist_userId');
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tutorials...</p>
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
            <div className="p-2 bg-primary rounded-lg">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Student Portal</h1>
              <p className="text-sm text-muted-foreground">ID: {studentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {codeAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-pulse w-2 h-2 bg-accent rounded-full"></div>
                Auto-saving...
              </div>
            )}
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tutorial Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tutorial Progress */}
            {currentTutorial && progress && (
              <Card className="smart-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Book className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{currentTutorial.title}</CardTitle>
                        <CardDescription>
                          Step {progress.currentStep + 1} of {currentTutorial.steps.length}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="smart-badge-primary">
                      {Math.round(((progress.currentStep + 1) / currentTutorial.steps.length) * 100)}% Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: currentTutorial.steps[progress.currentStep].replace(/\n/g, '<br>')
                      }} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={progress.currentStep === 0}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex gap-2">
                      {currentTutorial.steps.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index <= progress.currentStep ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <Button
                      onClick={handleNextStep}
                      disabled={progress.currentStep === currentTutorial.steps.length - 1}
                      className="smart-button-primary flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Code Editor */}
            <Card className="smart-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5 text-accent" />
                  <div>
                    <CardTitle className="text-lg">Code Editor</CardTitle>
                    <CardDescription>Write your JavaScript code here</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value)}
                  placeholder="// Write your JavaScript code here
console.log('Hello, World!');"
                  className="smart-textarea min-h-[300px] font-mono text-sm"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Code is automatically saved every 5 seconds
                  </p>
                  <Button onClick={submitCode} className="smart-button-accent">
                    Submit Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <div className="space-y-6">
            {/* Send Help Request */}
            <Card className="smart-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-warning" />
                  <div>
                    <CardTitle className="text-lg">Need Help?</CardTitle>
                    <CardDescription>Send a message to your teacher</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  placeholder="Describe what you need help with..."
                  className="smart-textarea"
                />
                <Button 
                  onClick={sendHelpRequest} 
                  className="w-full smart-button-secondary flex items-center gap-2"
                  disabled={!helpMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                  Send Help Request
                </Button>
              </CardContent>
            </Card>

            {/* Help History */}
            <Card className="smart-card">
              <CardHeader>
                <CardTitle className="text-lg">Help Requests</CardTitle>
                <CardDescription>Your recent conversations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {helpRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No help requests yet
                  </p>
                ) : (
                  helpRequests.map((request, index) => (
                    <div key={index} className="space-y-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium">You:</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{request.message}</p>
                      {request.response && (
                        <>
                          <div className="flex items-center gap-2 mt-3">
                            <CheckCircle className="h-4 w-4 text-success" />
                            <p className="text-sm font-medium text-success">Teacher:</p>
                          </div>
                          <p className="text-sm bg-success/10 p-2 rounded border-l-2 border-success">
                            {request.response}
                          </p>
                        </>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Student;