import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Tutorial = Database['public']['Tables']['tutorials']['Row'];
export type StudentProgress = Database['public']['Tables']['student_progress']['Row'];
export type CodeLog = Database['public']['Tables']['code_logs']['Row'];
export type HelpRequest = Database['public']['Tables']['help_requests']['Row'];
export type StudentSession = Database['public']['Tables']['student_sessions']['Row'];
export type ErrorLog = Database['public']['Tables']['error_logs']['Row'];

class SupabaseService {
  // Session management
  async createSession(): Promise<string> {
    const { data, error } = await supabase
      .from('student_sessions')
      .insert({
        student_id: (await supabase.auth.getUser()).data.user?.id,
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  }

  async endSession(sessionId: string): Promise<void> {
    await supabase
      .from('student_sessions')
      .update({ 
        is_active: false, 
        session_end: new Date().toISOString() 
      })
      .eq('id', sessionId);
  }

  async updateLastActivity(): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    await supabase
      .from('student_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('student_id', user.data.user.id)
      .eq('is_active', true);
  }

  // Profile management
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createProfile(name: string, userType: 'student' | 'teacher', studentId?: string): Promise<Profile> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('No user found');

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.data.user.id,
        name,
        user_type: userType,
        student_id: studentId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at');
    
    if (error) throw error;
    return data;
  }

  // Tutorial management
  async getTutorials(): Promise<Tutorial[]> {
    const { data, error } = await supabase
      .from('tutorials')
      .select('*')
      .order('created_at');
    
    if (error) throw error;
    return data;
  }

  async getTutorial(id: string): Promise<Tutorial | null> {
    const { data, error } = await supabase
      .from('tutorials')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Progress management
  async getStudentProgress(tutorialId: string): Promise<StudentProgress | null> {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('tutorial_id', tutorialId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getAllStudentProgress(): Promise<StudentProgress[]> {
    const { data, error } = await supabase
      .from('student_progress')
      .select(`
        *,
        profiles!inner(name, student_id),
        tutorials!inner(title, tutorial_id)
      `);
    
    if (error) throw error;
    return data;
  }

  async updateStudentProgress(tutorialId: string, currentStep: number): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('No user found');

    const { error } = await supabase
      .from('student_progress')
      .upsert({
        student_id: user.data.user.id,
        tutorial_id: tutorialId,
        current_step: currentStep,
      });
    
    if (error) throw error;
  }

  // Code logs
  async saveCodeLog(code: string, isSubmission: boolean = false, tutorialId?: string, stepNumber?: number, sessionId?: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('No user found');

    const { error } = await supabase
      .from('code_logs')
      .insert({
        student_id: user.data.user.id,
        code,
        is_submission: isSubmission,
        tutorial_id: tutorialId,
        step_number: stepNumber,
        session_id: sessionId,
      });
    
    if (error) throw error;
  }

  async getCodeLogs(studentId?: string, limit: number = 50): Promise<CodeLog[]> {
    let query = supabase
      .from('code_logs')
      .select(`
        *,
        profiles!inner(name, student_id)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getLatestCodeLogs(): Promise<{ [studentId: string]: CodeLog }> {
    const { data, error } = await supabase
      .from('code_logs')
      .select(`
        *,
        profiles!inner(name, student_id)
      `)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    const latestLogs: { [studentId: string]: CodeLog } = {};
    data.forEach(log => {
      if (!latestLogs[log.student_id]) {
        latestLogs[log.student_id] = log;
      }
    });
    
    return latestLogs;
  }

  // Help requests
  async createHelpRequest(message: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('No user found');

    const { error } = await supabase
      .from('help_requests')
      .insert({
        student_id: user.data.user.id,
        message,
      });
    
    if (error) throw error;
  }

  async getHelpRequests(studentId?: string): Promise<HelpRequest[]> {
    let query = supabase
      .from('help_requests')
      .select(`
        *,
        profiles!help_requests_student_id_fkey!inner(name, student_id)
      `)
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async respondToHelpRequest(requestId: string, response: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('No user found');

    const { error } = await supabase
      .from('help_requests')
      .update({
        response,
        teacher_id: user.data.user.id,
        status: 'responded',
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId);
    
    if (error) throw error;
  }

  // Error logs
  async logError(errorMessage: string, errorStack?: string, context?: any): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return; // Silent fail for error logging

    try {
      await supabase
        .from('error_logs')
        .insert({
          student_id: user.data.user.id,
          error_message: errorMessage,
          error_stack: errorStack,
          context: context || {},
        });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  async getErrorLogs(studentId?: string): Promise<ErrorLog[]> {
    let query = supabase
      .from('error_logs')
      .select(`
        *,
        profiles!inner(name, student_id)
      `)
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Real-time subscriptions
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  }

  subscribeToUserData(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user-${userId}-data`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'help_requests',
          filter: `student_id=eq.${userId}`
        }, 
        callback
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'student_progress',
          filter: `student_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  subscribeToTeacherData(callback: (payload: any) => void) {
    return supabase
      .channel('teacher-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'help_requests' }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'code_logs' }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'student_progress' }, 
        callback
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'student_sessions' }, 
        callback
      )
      .subscribe();
  }
}

export const supabaseService = new SupabaseService();