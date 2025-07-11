-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'teacher')),
  student_id TEXT, -- For students: S001, S002, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tutorials table
CREATE TABLE public.tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutorial_id TEXT NOT NULL UNIQUE, -- TUT001, TUT002, etc.
  title TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student progress table
CREATE TABLE public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, tutorial_id)
);

-- Create code logs table for tracking all student code activity
CREATE TABLE public.code_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  is_submission BOOLEAN NOT NULL DEFAULT false,
  tutorial_id UUID REFERENCES public.tutorials(id),
  step_number INTEGER,
  session_id UUID, -- To group logs by session
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create help requests table
CREATE TABLE public.help_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  teacher_id UUID REFERENCES public.profiles(user_id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student sessions table for tracking active sessions
CREATE TABLE public.student_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create error logs table
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'teacher'
  )
);

-- Create policies for tutorials
CREATE POLICY "Everyone can view tutorials" ON public.tutorials
FOR SELECT USING (true);

CREATE POLICY "Teachers can manage tutorials" ON public.tutorials
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'teacher'
  )
);

-- Create policies for student progress
CREATE POLICY "Students can view their own progress" ON public.student_progress
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own progress" ON public.student_progress
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all progress" ON public.student_progress
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'teacher'
  )
);

-- Create policies for code logs
CREATE POLICY "Students can create their own code logs" ON public.code_logs
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own code logs" ON public.code_logs
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all code logs" ON public.code_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'teacher'
  )
);

-- Create policies for help requests
CREATE POLICY "Students can manage their own help requests" ON public.help_requests
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view and respond to all help requests" ON public.help_requests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'teacher'
  )
);

-- Create policies for student sessions
CREATE POLICY "Students can manage their own sessions" ON public.student_sessions
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all sessions" ON public.student_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'teacher'
  )
);

-- Create policies for error logs
CREATE POLICY "Students can create their own error logs" ON public.error_logs
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own error logs" ON public.error_logs
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all error logs" ON public.error_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND user_type = 'teacher'
  )
);

-- Create functions for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at
  BEFORE UPDATE ON public.tutorials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_requests_updated_at
  BEFORE UPDATE ON public.help_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample tutorials
INSERT INTO public.tutorials (tutorial_id, title, steps) VALUES 
(
  'TUT001',
  'Introduction to JavaScript Variables',
  '[
    "<h3>Step 1: Understanding Variables</h3><p>Variables are containers that store data values. In JavaScript, you can create variables using <code>let</code>, <code>const</code>, or <code>var</code>.</p><h4>Example:</h4><pre><code>let message = \"Hello, World!\";\nconst pi = 3.14159;\nvar counter = 0;</code></pre><p><strong>Try it:</strong> Create a variable called <code>myName</code> and assign your name to it.</p>",
    "<h3>Step 2: Variable Types</h3><p>JavaScript has several data types: strings, numbers, booleans, arrays, and objects.</p><h4>Examples:</h4><pre><code>let name = \"Alice\";        // String\nlet age = 25;             // Number\nlet isStudent = true;     // Boolean\nlet hobbies = [\"reading\", \"coding\"]; // Array\nlet person = { name: \"Bob\", age: 30 }; // Object</code></pre><p><strong>Try it:</strong> Create variables of different types and log them using <code>console.log()</code>.</p>",
    "<h3>Step 3: Working with Variables</h3><p>You can perform operations with variables and change their values.</p><h4>Examples:</h4><pre><code>let x = 10;\nlet y = 5;\nlet sum = x + y;          // Addition\nlet product = x * y;      // Multiplication\n\nlet greeting = \"Hello\";\nlet name = \"World\";\nlet message = greeting + \" \" + name + \"!\"; // String concatenation</code></pre><p><strong>Try it:</strong> Create two number variables and perform all mathematical operations (+, -, *, /) with them.</p>",
    "<h3>Step 4: Challenge Exercise</h3><p>Now let''s put it all together! Create a small program that:</p><ul><li>Declares your personal information (name, age, favorite color)</li><li>Calculates your birth year based on your age</li><li>Creates a message introducing yourself</li><li>Logs everything to the console</li></ul><h4>Example solution:</h4><pre><code>let name = \"Your Name\";\nlet age = 20;\nlet favoriteColor = \"blue\";\nlet currentYear = 2025;\nlet birthYear = currentYear - age;\n\nlet introduction = \"Hi! I''m \" + name + \". I''m \" + age + \" years old, born in \" + birthYear + \". My favorite color is \" + favoriteColor + \".\";\n\nconsole.log(introduction);</code></pre>"
  ]'::jsonb
),
(
  'TUT002',
  'JavaScript Functions and Loops',
  '[
    "<h3>Step 1: Creating Functions</h3><p>Functions are reusable blocks of code that perform specific tasks.</p><h4>Function Declaration:</h4><pre><code>function greet(name) {\n    return \"Hello, \" + name + \"!\";\n}\n\n// Call the function\nlet message = greet(\"Alice\");\nconsole.log(message);</code></pre><p><strong>Try it:</strong> Create a function that takes two numbers and returns their sum.</p>",
    "<h3>Step 2: For Loops</h3><p>Loops allow you to repeat code multiple times.</p><h4>For Loop Example:</h4><pre><code>for (let i = 0; i < 5; i++) {\n    console.log(\"Count: \" + i);\n}\n\n// Loop through an array\nlet fruits = [\"apple\", \"banana\", \"orange\"];\nfor (let i = 0; i < fruits.length; i++) {\n    console.log(fruits[i]);\n}</code></pre><p><strong>Try it:</strong> Write a loop that prints numbers from 1 to 10.</p>",
    "<h3>Step 3: While Loops</h3><p>While loops continue as long as a condition is true.</p><h4>While Loop Example:</h4><pre><code>let count = 0;\nwhile (count < 3) {\n    console.log(\"Count is: \" + count);\n    count++;\n}\n\n// Be careful with infinite loops!\nlet number = 16;\nwhile (number > 1) {\n    number = number / 2;\n    console.log(number);\n}</code></pre><p><strong>Try it:</strong> Create a while loop that counts down from 10 to 1.</p>",
    "<h3>Step 4: Combining Functions and Loops</h3><p>Let''s create a more complex program using both functions and loops.</p><h4>Challenge:</h4><p>Create a function called <code>multiplicationTable</code> that:</p><ul><li>Takes a number as parameter</li><li>Uses a loop to create a multiplication table for that number (1-10)</li><li>Returns an array of results</li></ul><h4>Example solution:</h4><pre><code>function multiplicationTable(number) {\n    let results = [];\n    for (let i = 1; i <= 10; i++) {\n        let result = number * i;\n        results.push(number + \" x \" + i + \" = \" + result);\n    }\n    return results;\n}\n\nlet table = multiplicationTable(7);\nfor (let i = 0; i < table.length; i++) {\n    console.log(table[i]);\n}</code></pre>"
  ]'::jsonb
);

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.tutorials REPLICA IDENTITY FULL;
ALTER TABLE public.student_progress REPLICA IDENTITY FULL;
ALTER TABLE public.code_logs REPLICA IDENTITY FULL;
ALTER TABLE public.help_requests REPLICA IDENTITY FULL;
ALTER TABLE public.student_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.error_logs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tutorials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.error_logs;