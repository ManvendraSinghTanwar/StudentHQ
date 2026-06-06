export const mockDashboardData = {
  upcomingDeadlines: [
    { id: 1, title: 'Data Structures Assignment', daysLeft: 2, subject: 'CSE 201' },
    { id: 2, title: 'Physics Lab Report', daysLeft: 5, subject: 'PHY 101' },
    { id: 3, title: 'History Essay', daysLeft: 8, subject: 'HIS 102' },
  ],
  studyTasks: [
    { id: 1, title: 'Review Binary Trees', completed: false, priority: 'high' },
    { id: 2, title: 'Complete Practice Problems', completed: true, priority: 'high' },
    { id: 3, title: 'Watch Calculus Lecture', completed: false, priority: 'medium' },
  ],
  expenseSummary: {
    total: 2400,
    spent: 1920,
    remaining: 480,
    categories: [
      { name: 'Food', amount: 600, percentage: 31 },
      { name: 'Transport', amount: 400, percentage: 21 },
      { name: 'Books', amount: 500, percentage: 26 },
      { name: 'Misc', amount: 420, percentage: 22 },
    ],
  },
  healthRecommendations: [
    'Take a 10-minute break every hour while studying',
    'Drink more water - aim for 8 glasses daily',
    'Get 7-8 hours of sleep for better focus',
    'Practice 15 minutes of deep breathing daily',
  ],
  recentActions: [
    { id: 1, action: 'Processed receipt from coffee shop', time: '2 hours ago' },
    { id: 2, action: 'Analyzed study notes for Chapter 5', time: '5 hours ago' },
    { id: 3, action: 'Generated study plan for exam', time: 'Yesterday' },
  ],
}

export const mockResultTypes = {
  assignment: {
    title: 'Data Structures Assignment Analysis',
    summary: 'Based on your screenshot, we identified the assignment requirements and created a structured study plan.',
    deadline: '2 days',
    studyPlan: [
      'Review binary tree traversal methods (2 hours)',
      'Implement sorting algorithms (3 hours)',
      'Practice with edge cases (2 hours)',
      'Complete the assignment (4 hours)',
    ],
  },
  notes: {
    title: 'Study Notes Summary',
    summary: 'We analyzed your notes and created flashcards for better retention.',
    flashcards: [
      { front: 'What is Big O Notation?', back: 'A mathematical notation describing the limiting behavior of a function' },
      { front: 'Define Time Complexity', back: 'The amount of time taken by an algorithm to run as a function of input size' },
      { front: 'What is Space Complexity?', back: 'The amount of memory used by an algorithm as a function of input size' },
    ],
  },
  receipt: {
    title: 'Expense Receipt Analysis',
    merchant: 'Campus Bookstore',
    amount: '$45.99',
    category: 'Books & Supplies',
    insight: 'You\'ve spent $892 on books this month. Consider using the library for some resources.',
    date: new Date().toLocaleDateString(),
  },
  job: {
    title: 'Job Posting Analysis',
    position: 'Software Engineering Intern',
    company: 'Tech Corp',
    keySkills: ['Python', 'React', 'SQL', 'Git', 'REST APIs'],
    applicationDraft: 'Dear Hiring Manager, I am excited to apply for the Software Engineering Intern position at Tech Corp...',
    matchPercentage: 85,
  },
  menu: {
    title: 'Mess Menu Analysis',
    todaysMeal: 'Tandoori Chicken with Rice',
    nutrition: { calories: 450, protein: 35, carbs: 40, fat: 12 },
    recommendation: 'Pair with a side salad and plenty of water for a balanced meal.',
    alternativeOptions: ['Paneer Tikka', 'Fish Curry', 'Vegetable Biryani'],
  },
}

export const agents = [
  { id: 'router', name: 'Router Agent', icon: '🔀' },
  { id: 'study', name: 'Study Agent', icon: '📚' },
  { id: 'schedule', name: 'Schedule Agent', icon: '📅' },
  { id: 'expense', name: 'Expense Agent', icon: '💰' },
  { id: 'content', name: 'Content Agent', icon: '📄' },
  { id: 'health', name: 'Health Agent', icon: '❤️' },
]
