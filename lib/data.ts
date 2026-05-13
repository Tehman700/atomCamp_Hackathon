export interface Course {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  modules: number;
  tags: string[];
  icon: string;
  color: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  duration: string;
  order: number;
}

export interface QuizQuestion {
  id: string;
  courseId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledCourses: string[];
  progress: Record<string, number>;
  lastActive: string;
  streak: number;
  totalHours: number;
  riskScore: number;
  riskReasons: string[];
  quizAvg: number;
}

export const COURSES: Course[] = [
  {
    id: "python-101",
    title: "Python Fundamentals",
    description: "Master Python from zero — variables, loops, functions, and OOP. The essential foundation for every career in tech.",
    level: "beginner",
    duration: "4 weeks",
    modules: 8,
    tags: ["Python", "Programming", "Foundations"],
    icon: "🐍",
    color: "#3B82F6",
  },
  {
    id: "data-science",
    title: "Data Science with Python",
    description: "Transform raw data into powerful insights using Pandas, NumPy, Matplotlib, and real-world datasets.",
    level: "intermediate",
    duration: "6 weeks",
    modules: 12,
    tags: ["Data Science", "Pandas", "Statistics"],
    icon: "📊",
    color: "#06B6D4",
  },
  {
    id: "ml-bootcamp",
    title: "Machine Learning Bootcamp",
    description: "Build predictive models from scratch — regression, classification, clustering, and model evaluation.",
    level: "intermediate",
    duration: "8 weeks",
    modules: 16,
    tags: ["ML", "Scikit-learn", "Algorithms"],
    icon: "🤖",
    color: "#7C3AED",
  },
  {
    id: "deep-learning",
    title: "Deep Learning & Neural Networks",
    description: "Design and train neural networks using TensorFlow and PyTorch. CNNs, RNNs, Transformers.",
    level: "advanced",
    duration: "10 weeks",
    modules: 20,
    tags: ["Deep Learning", "PyTorch", "TensorFlow"],
    icon: "🧠",
    color: "#EC4899",
  },
  {
    id: "web-dev",
    title: "Full-Stack Web Development",
    description: "Build production-ready web apps with React, Node.js, and modern deployment workflows.",
    level: "intermediate",
    duration: "8 weeks",
    modules: 14,
    tags: ["React", "Node.js", "Web Dev"],
    icon: "🌐",
    color: "#10B981",
  },
  {
    id: "cloud-aws",
    title: "Cloud Computing with AWS",
    description: "Deploy scalable applications on AWS — EC2, S3, Lambda, RDS, and CI/CD pipelines.",
    level: "intermediate",
    duration: "6 weeks",
    modules: 10,
    tags: ["AWS", "Cloud", "DevOps"],
    icon: "☁️",
    color: "#F59E0B",
  },
];

export const LESSONS: Lesson[] = [
  {
    id: "py-l1",
    courseId: "python-101",
    title: "Variables & Data Types",
    content: `# Variables & Data Types in Python

Python is a dynamically-typed language — you don't declare types explicitly. The interpreter figures it out.

## The Core Types

\`\`\`python
# Integers — whole numbers
age = 25
year = 2024

# Floats — decimal numbers
temperature = 36.6
pi = 3.14159

# Strings — text
name = "AtomCamp"
greeting = 'Hello, World!'

# Booleans — True or False
is_enrolled = True
has_completed = False

# NoneType — absence of value
result = None
\`\`\`

## Why Types Matter

Type errors are one of the most common bugs in any language. Python's flexibility is powerful — but you need to understand what each type can and cannot do.

\`\`\`python
# This works
score = 95
print("Your score: " + str(score))

# This fails — can't concatenate int and string
# print("Your score: " + score)  # TypeError!
\`\`\`

## Type Conversion

\`\`\`python
user_input = "42"          # string from input()
number = int(user_input)   # convert to int
decimal = float(user_input) # convert to float

print(type(number))  # <class 'int'>
\`\`\`

## Pro Tip: f-Strings (Python 3.6+)

The cleanest way to embed variables in strings:

\`\`\`python
name = "Ali"
score = 98
print(f"Student {name} scored {score}%")
# Output: Student Ali scored 98%
\`\`\`

## Practice Challenge

Write a program that stores your name, age, and GPA as variables, then prints a formatted introduction using f-strings.`,
    duration: "25 min",
    order: 1,
  },
  {
    id: "py-l2",
    courseId: "python-101",
    title: "Control Flow: if/elif/else",
    content: `# Control Flow in Python

Control flow lets your program make decisions. Every intelligent system — from a simple grader to an AI model — runs on conditional logic.

## The if Statement

\`\`\`python
score = 85

if score >= 90:
    print("Grade: A — Excellent!")
elif score >= 80:
    print("Grade: B — Good work!")
elif score >= 70:
    print("Grade: C — Keep pushing!")
else:
    print("Grade: F — Let's review together.")
\`\`\`

## Comparison Operators

| Operator | Meaning |
|----------|---------|
| \`==\` | Equal to |
| \`!=\` | Not equal |
| \`>\` / \`<\` | Greater / Less |
| \`>=\` / \`<=\` | Greater-or-equal / Less-or-equal |

## Logical Operators

\`\`\`python
age = 22
is_student = True

# and — both must be True
if age >= 18 and is_student:
    print("Eligible for student discount")

# or — at least one True
if age < 13 or age > 65:
    print("Special pricing applies")

# not — flips the boolean
if not has_paid:
    print("Payment required")
\`\`\`

## Nested Conditions

\`\`\`python
def classify_learner(score, attendance):
    if attendance >= 80:
        if score >= 85:
            return "High Achiever"
        else:
            return "Consistent Learner"
    else:
        if score >= 85:
            return "Talented but Irregular"
        else:
            return "At Risk — Intervention Needed"
\`\`\`

This kind of logic is exactly what our adaptive LMS uses to identify which students need support!`,
    duration: "30 min",
    order: 2,
  },
  {
    id: "ml-l1",
    courseId: "ml-bootcamp",
    title: "What is Machine Learning?",
    content: `# What is Machine Learning?

Machine Learning is the science of getting computers to learn from data — without being explicitly programmed for every possible scenario.

## The Traditional vs. ML Approach

**Traditional Programming:**
\`\`\`
Rules + Data → Output
\`\`\`

**Machine Learning:**
\`\`\`
Data + Output (labels) → Rules (the model)
\`\`\`

## Three Types of ML

### 1. Supervised Learning
You provide labeled examples. The model learns the mapping.

\`\`\`python
# Example: Predict house prices
# Input: [size, bedrooms, location]
# Output: price (labeled training data)

from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
\`\`\`

### 2. Unsupervised Learning
No labels. The model finds structure on its own.

\`\`\`python
# Example: Cluster students by learning behavior
from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3)
kmeans.fit(student_features)
# Discovers: Fast learners, Average, Struggling
\`\`\`

### 3. Reinforcement Learning
An agent learns by trial and error, receiving rewards.

Think: how AlphaGo mastered chess, or how recommendation systems optimize engagement.

## The ML Workflow

1. **Define the problem** — what are you predicting?
2. **Collect & clean data** — garbage in, garbage out
3. **Choose a model** — start simple
4. **Train** — fit the model to data
5. **Evaluate** — measure performance
6. **Deploy** — use it in the real world
7. **Monitor** — models drift over time

## Real-World Example: AtomCamp's Risk Detection

Our adaptive LMS uses ML to predict which students are at risk of dropping out based on:
- Login frequency
- Quiz scores over time
- Time spent per lesson
- Forum participation

This is supervised learning — we train on historical student data to predict future outcomes.`,
    duration: "40 min",
    order: 1,
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    courseId: "python-101",
    question: "What will `type(3.14)` return in Python?",
    options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'decimal'>"],
    correctIndex: 1,
    explanation: "3.14 is a floating-point number in Python, so its type is `float`. Python doesn't have a separate `double` type like some other languages.",
    difficulty: "easy",
  },
  {
    id: "q2",
    courseId: "python-101",
    question: "Which of the following correctly creates an f-string in Python 3?",
    options: ['f"Hello {name}"', '"Hello {name}".format()', '"Hello" + name', 'printf("Hello %s", name)'],
    correctIndex: 0,
    explanation: "f-strings (formatted string literals) use the f prefix before quotes and embed expressions with curly braces. They're the most readable and performant way to format strings in modern Python.",
    difficulty: "easy",
  },
  {
    id: "q3",
    courseId: "python-101",
    question: "What does this code print?\n```python\nx = 10\nif x > 5:\n    print('A')\nelif x > 8:\n    print('B')\nelse:\n    print('C')\n```",
    options: ["A", "B", "A and B", "C"],
    correctIndex: 0,
    explanation: "Python evaluates conditions top-to-bottom and stops at the first True condition. x > 5 is True, so 'A' is printed and the elif is never reached — even though x > 8 is also True.",
    difficulty: "medium",
  },
  {
    id: "q4",
    courseId: "ml-bootcamp",
    question: "In supervised learning, what does the model learn from?",
    options: [
      "Unlabeled data to discover hidden patterns",
      "Labeled input-output pairs to learn a mapping",
      "Rewards and penalties from an environment",
      "Rules hard-coded by the programmer",
    ],
    correctIndex: 1,
    explanation: "Supervised learning trains on labeled data — pairs of inputs and their correct outputs. The model learns the mapping function so it can predict outputs for new, unseen inputs.",
    difficulty: "easy",
  },
  {
    id: "q5",
    courseId: "ml-bootcamp",
    question: "Which scikit-learn method is used to train a model on training data?",
    options: ["model.train(X, y)", "model.fit(X, y)", "model.learn(X, y)", "model.run(X, y)"],
    correctIndex: 1,
    explanation: "In scikit-learn, `.fit(X, y)` trains the model. The name reflects the statistical concept of 'fitting' a model to data. After fitting, use `.predict()` for new predictions.",
    difficulty: "easy",
  },
];

export const STUDENTS: Student[] = [
  {
    id: "s1",
    name: "Fatima Malik",
    email: "fatima@example.com",
    avatar: "FM",
    enrolledCourses: ["python-101", "data-science"],
    progress: { "python-101": 85, "data-science": 42 },
    lastActive: "2 hours ago",
    streak: 12,
    totalHours: 34,
    riskScore: 15,
    riskReasons: [],
    quizAvg: 88,
  },
  {
    id: "s2",
    name: "Ahmed Raza",
    email: "ahmed@example.com",
    avatar: "AR",
    enrolledCourses: ["ml-bootcamp"],
    progress: { "ml-bootcamp": 23 },
    lastActive: "5 days ago",
    streak: 0,
    totalHours: 8,
    riskScore: 78,
    riskReasons: ["No login for 5 days", "Quiz average below 60%", "Only 23% course completion"],
    quizAvg: 54,
  },
  {
    id: "s3",
    name: "Zara Khan",
    email: "zara@example.com",
    avatar: "ZK",
    enrolledCourses: ["python-101", "web-dev"],
    progress: { "python-101": 100, "web-dev": 67 },
    lastActive: "1 hour ago",
    streak: 21,
    totalHours: 56,
    riskScore: 5,
    riskReasons: [],
    quizAvg: 94,
  },
  {
    id: "s4",
    name: "Omar Siddiqui",
    email: "omar@example.com",
    avatar: "OS",
    enrolledCourses: ["data-science", "ml-bootcamp"],
    progress: { "data-science": 55, "ml-bootcamp": 10 },
    lastActive: "3 days ago",
    streak: 2,
    totalHours: 19,
    riskScore: 62,
    riskReasons: ["Inconsistent login pattern", "Dropped quiz scores in last 2 weeks", "Low engagement with video content"],
    quizAvg: 67,
  },
  {
    id: "s5",
    name: "Sara Hussain",
    email: "sara@example.com",
    avatar: "SH",
    enrolledCourses: ["python-101"],
    progress: { "python-101": 38 },
    lastActive: "8 days ago",
    streak: 0,
    totalHours: 5,
    riskScore: 91,
    riskReasons: ["Inactive for 8 days", "Only 38% completion after 3 weeks", "Has not attempted any quizzes", "No forum participation"],
    quizAvg: 0,
  },
  {
    id: "s6",
    name: "Ali Hassan",
    email: "ali@example.com",
    avatar: "AH",
    enrolledCourses: ["cloud-aws", "web-dev"],
    progress: { "cloud-aws": 72, "web-dev": 88 },
    lastActive: "30 minutes ago",
    streak: 8,
    totalHours: 41,
    riskScore: 22,
    riskReasons: ["Slightly slower pace on Cloud module"],
    quizAvg: 81,
  },
  {
    id: "s7",
    name: "Nadia Tariq",
    email: "nadia@example.com",
    avatar: "NT",
    enrolledCourses: ["deep-learning"],
    progress: { "deep-learning": 15 },
    lastActive: "4 days ago",
    streak: 1,
    totalHours: 7,
    riskScore: 55,
    riskReasons: ["Advanced course with low initial progress", "4 days since last session"],
    quizAvg: 71,
  },
];

export const LEARNING_PATH_TEMPLATES: Record<string, string[]> = {
  "ai-ml": ["python-101", "data-science", "ml-bootcamp", "deep-learning"],
  "web-dev": ["python-101", "web-dev", "cloud-aws"],
  "data-science": ["python-101", "data-science", "ml-bootcamp"],
  "cloud": ["web-dev", "cloud-aws"],
};
