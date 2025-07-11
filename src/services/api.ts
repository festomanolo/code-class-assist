// API Service for Smart Assistance
// This simulates a REST API using mock data and localStorage for persistence

interface Student {
  id: string;
  name: string;
}

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

interface CodeLog {
  studentId: string;
  code: string;
  timestamp: string;
  isSubmission?: boolean;
}

interface HelpRequest {
  id: string;
  studentId: string;
  message: string;
  response?: string;
  timestamp: string;
  responseTimestamp?: string;
}

// Mock API Base URL (replace with actual API)
const API_BASE_URL = 'https://mockapi.smartassist.com/api';

// Simulate API delays
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage using localStorage
const STORAGE_KEYS = {
  STUDENTS: 'smartAssist_students',
  TUTORIALS: 'smartAssist_tutorials',
  PROGRESS: 'smartAssist_progress',
  CODE_LOGS: 'smartAssist_codeLogs',
  HELP_REQUESTS: 'smartAssist_helpRequests'
};

// Initialize mock data
const initializeMockData = () => {
  // Students
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    const students: Student[] = [
      { id: 'S001', name: 'Alice Johnson' },
      { id: 'S002', name: 'Bob Smith' },
      { id: 'S003', name: 'Carol Davis' },
      { id: 'S004', name: 'David Wilson' },
      { id: 'S005', name: 'Eva Brown' }
    ];
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  // Tutorials
  if (!localStorage.getItem(STORAGE_KEYS.TUTORIALS)) {
    const tutorials: Tutorial[] = [
      {
        id: 'TUT001',
        title: 'Introduction to JavaScript Variables',
        steps: [
          `<h3>Step 1: Understanding Variables</h3>
<p>Variables are containers that store data values. In JavaScript, you can create variables using <code>let</code>, <code>const</code>, or <code>var</code>.</p>

<h4>Example:</h4>
<pre><code>let message = "Hello, World!";
const pi = 3.14159;
var counter = 0;</code></pre>

<p><strong>Try it:</strong> Create a variable called <code>myName</code> and assign your name to it.</p>`,

          `<h3>Step 2: Variable Types</h3>
<p>JavaScript has several data types: strings, numbers, booleans, arrays, and objects.</p>

<h4>Examples:</h4>
<pre><code>let name = "Alice";        // String
let age = 25;             // Number
let isStudent = true;     // Boolean
let hobbies = ["reading", "coding"]; // Array
let person = { name: "Bob", age: 30 }; // Object</code></pre>

<p><strong>Try it:</strong> Create variables of different types and log them using <code>console.log()</code>.</p>`,

          `<h3>Step 3: Working with Variables</h3>
<p>You can perform operations with variables and change their values.</p>

<h4>Examples:</h4>
<pre><code>let x = 10;
let y = 5;
let sum = x + y;          // Addition
let product = x * y;      // Multiplication

let greeting = "Hello";
let name = "World";
let message = greeting + " " + name + "!"; // String concatenation</code></pre>

<p><strong>Try it:</strong> Create two number variables and perform all mathematical operations (+, -, *, /) with them.</p>`,

          `<h3>Step 4: Challenge Exercise</h3>
<p>Now let's put it all together! Create a small program that:</p>

<ul>
<li>Declares your personal information (name, age, favorite color)</li>
<li>Calculates your birth year based on your age</li>
<li>Creates a message introducing yourself</li>
<li>Logs everything to the console</li>
</ul>

<h4>Example solution:</h4>
<pre><code>let name = "Your Name";
let age = 20;
let favoriteColor = "blue";
let currentYear = 2025;
let birthYear = currentYear - age;

let introduction = "Hi! I'm " + name + ". I'm " + age + " years old, born in " + birthYear + ". My favorite color is " + favoriteColor + ".";

console.log(introduction);</code></pre>`
        ]
      },
      {
        id: 'TUT002',
        title: 'JavaScript Functions and Loops',
        steps: [
          `<h3>Step 1: Creating Functions</h3>
<p>Functions are reusable blocks of code that perform specific tasks.</p>

<h4>Function Declaration:</h4>
<pre><code>function greet(name) {
    return "Hello, " + name + "!";
}

// Call the function
let message = greet("Alice");
console.log(message);</code></pre>

<p><strong>Try it:</strong> Create a function that takes two numbers and returns their sum.</p>`,

          `<h3>Step 2: For Loops</h3>
<p>Loops allow you to repeat code multiple times.</p>

<h4>For Loop Example:</h4>
<pre><code>for (let i = 0; i < 5; i++) {
    console.log("Count: " + i);
}

// Loop through an array
let fruits = ["apple", "banana", "orange"];
for (let i = 0; i < fruits.length; i++) {
    console.log(fruits[i]);
}</code></pre>

<p><strong>Try it:</strong> Write a loop that prints numbers from 1 to 10.</p>`,

          `<h3>Step 3: While Loops</h3>
<p>While loops continue as long as a condition is true.</p>

<h4>While Loop Example:</h4>
<pre><code>let count = 0;
while (count < 3) {
    console.log("Count is: " + count);
    count++;
}

// Be careful with infinite loops!
let number = 16;
while (number > 1) {
    number = number / 2;
    console.log(number);
}</code></pre>

<p><strong>Try it:</strong> Create a while loop that counts down from 10 to 1.</p>`,

          `<h3>Step 4: Combining Functions and Loops</h3>
<p>Let's create a more complex program using both functions and loops.</p>

<h4>Challenge:</h4>
<p>Create a function called <code>multiplicationTable</code> that:</p>
<ul>
<li>Takes a number as parameter</li>
<li>Uses a loop to create a multiplication table for that number (1-10)</li>
<li>Returns an array of results</li>
</ul>

<h4>Example solution:</h4>
<pre><code>function multiplicationTable(number) {
    let results = [];
    for (let i = 1; i <= 10; i++) {
        let result = number * i;
        results.push(number + " x " + i + " = " + result);
    }
    return results;
}

let table = multiplicationTable(7);
for (let i = 0; i < table.length; i++) {
    console.log(table[i]);
}</code></pre>`
        ]
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TUTORIALS, JSON.stringify(tutorials));
  }

  // Initialize empty arrays for other data
  if (!localStorage.getItem(STORAGE_KEYS.PROGRESS)) {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CODE_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.CODE_LOGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HELP_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.HELP_REQUESTS, JSON.stringify([]));
  }
};

// Helper functions for localStorage operations
const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize mock data on service load
initializeMockData();

export const APIService = {
  // Students
  async getStudents(): Promise<Student[]> {
    await simulateDelay();
    return getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  },

  async getStudent(id: string): Promise<Student | null> {
    await simulateDelay();
    const students = getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
    return students.find(s => s.id === id) || null;
  },

  // Tutorials
  async getTutorials(): Promise<Tutorial[]> {
    await simulateDelay();
    return getFromStorage<Tutorial>(STORAGE_KEYS.TUTORIALS);
  },

  async getTutorial(id: string): Promise<Tutorial | null> {
    await simulateDelay();
    const tutorials = getFromStorage<Tutorial>(STORAGE_KEYS.TUTORIALS);
    return tutorials.find(t => t.id === id) || null;
  },

  // Student Progress
  async getStudentProgress(studentId: string): Promise<StudentProgress | null> {
    await simulateDelay();
    const progress = getFromStorage<StudentProgress>(STORAGE_KEYS.PROGRESS);
    return progress.find(p => p.studentId === studentId) || null;
  },

  async getAllStudentProgress(): Promise<StudentProgress[]> {
    await simulateDelay();
    return getFromStorage<StudentProgress>(STORAGE_KEYS.PROGRESS);
  },

  async updateStudentProgress(studentId: string, tutorialId: string, currentStep: number): Promise<void> {
    await simulateDelay();
    const progress = getFromStorage<StudentProgress>(STORAGE_KEYS.PROGRESS);
    const existingIndex = progress.findIndex(p => p.studentId === studentId);
    
    const newProgress: StudentProgress = { studentId, tutorialId, currentStep };
    
    if (existingIndex >= 0) {
      progress[existingIndex] = newProgress;
    } else {
      progress.push(newProgress);
    }
    
    saveToStorage(STORAGE_KEYS.PROGRESS, progress);
  },

  // Code Logs
  async getCodeLogs(studentId: string): Promise<CodeLog[]> {
    await simulateDelay();
    const logs = getFromStorage<CodeLog>(STORAGE_KEYS.CODE_LOGS);
    return logs.filter(log => log.studentId === studentId);
  },

  async getLatestCodeLog(studentId: string): Promise<CodeLog | null> {
    await simulateDelay();
    const logs = getFromStorage<CodeLog>(STORAGE_KEYS.CODE_LOGS);
    const studentLogs = logs
      .filter(log => log.studentId === studentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return studentLogs[0] || null;
  },

  async getAllLatestCodeLogs(): Promise<{ [studentId: string]: CodeLog }> {
    await simulateDelay();
    const logs = getFromStorage<CodeLog>(STORAGE_KEYS.CODE_LOGS);
    const latestLogs: { [studentId: string]: CodeLog } = {};
    
    // Group by student and get latest for each
    logs.forEach(log => {
      if (!latestLogs[log.studentId] || 
          new Date(log.timestamp) > new Date(latestLogs[log.studentId].timestamp)) {
        latestLogs[log.studentId] = log;
      }
    });
    
    return latestLogs;
  },

  async saveCodeLog(studentId: string, code: string, isSubmission: boolean = false): Promise<void> {
    await simulateDelay();
    const logs = getFromStorage<CodeLog>(STORAGE_KEYS.CODE_LOGS);
    
    const newLog: CodeLog = {
      studentId,
      code,
      timestamp: new Date().toISOString(),
      isSubmission
    };
    
    logs.push(newLog);
    saveToStorage(STORAGE_KEYS.CODE_LOGS, logs);
  },

  // Help Requests
  async getHelpRequests(studentId: string): Promise<HelpRequest[]> {
    await simulateDelay();
    const requests = getFromStorage<HelpRequest>(STORAGE_KEYS.HELP_REQUESTS);
    return requests
      .filter(req => req.studentId === studentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async getAllHelpRequests(): Promise<HelpRequest[]> {
    await simulateDelay();
    const requests = getFromStorage<HelpRequest>(STORAGE_KEYS.HELP_REQUESTS);
    return requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async createHelpRequest(studentId: string, message: string): Promise<void> {
    await simulateDelay();
    const requests = getFromStorage<HelpRequest>(STORAGE_KEYS.HELP_REQUESTS);
    
    const newRequest: HelpRequest = {
      id: Date.now().toString(),
      studentId,
      message,
      timestamp: new Date().toISOString()
    };
    
    requests.push(newRequest);
    saveToStorage(STORAGE_KEYS.HELP_REQUESTS, requests);
  },

  async respondToHelpRequest(requestId: string, response: string): Promise<void> {
    await simulateDelay();
    const requests = getFromStorage<HelpRequest>(STORAGE_KEYS.HELP_REQUESTS);
    const requestIndex = requests.findIndex(req => req.id === requestId);
    
    if (requestIndex >= 0) {
      requests[requestIndex].response = response;
      requests[requestIndex].responseTimestamp = new Date().toISOString();
      saveToStorage(STORAGE_KEYS.HELP_REQUESTS, requests);
    }
  },

  // Utility function to clear all data (for testing)
  async clearAllData(): Promise<void> {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    initializeMockData();
  }
};