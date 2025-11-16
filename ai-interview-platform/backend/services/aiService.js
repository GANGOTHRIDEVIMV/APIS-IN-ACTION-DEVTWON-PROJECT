// AI Service for question generation, analysis, and feedback
// This is a mock implementation - in production, integrate with OpenAI API or similar

class AIService {
  // Generate interview questions based on job role and resume
  static generateQuestions(jobRole, resumeData, difficulty = 'Medium', count = 5) {
    const questionBank = {
      'Software Developer': {
        Technical: [
          'Explain the difference between REST and GraphQL APIs.',
          'What is the time complexity of binary search?',
          'Describe the SOLID principles in object-oriented programming.',
          'How would you optimize a slow database query?',
          'Explain the concept of closures in JavaScript.',
          'What are the differences between SQL and NoSQL databases?',
          'Describe your experience with version control systems like Git.',
          'How do you handle error handling in your applications?'
        ],
        Behavioral: [
          'Tell me about a challenging project you worked on.',
          'How do you handle tight deadlines and pressure?',
          'Describe a time when you had to learn a new technology quickly.',
          'How do you approach debugging complex issues?',
          'Tell me about a time you disagreed with a team member.'
        ],
        Situational: [
          'How would you design a URL shortening service like bit.ly?',
          'If you inherited legacy code, how would you approach refactoring it?',
          'How would you handle a production bug affecting users?',
          'Describe how you would implement a caching strategy.'
        ]
      },
      'Data Scientist': {
        Technical: [
          'Explain the difference between supervised and unsupervised learning.',
          'What is overfitting and how do you prevent it?',
          'Describe the working of a Random Forest algorithm.',
          'How do you handle missing data in a dataset?',
          'Explain the bias-variance tradeoff.'
        ],
        Behavioral: [
          'Describe a data analysis project you are proud of.',
          'How do you communicate technical findings to non-technical stakeholders?',
          'Tell me about a time when your analysis led to a business decision.'
        ]
      },
      'Product Manager': {
        Technical: [
          'How do you prioritize features in a product roadmap?',
          'Explain how you would conduct user research.',
          'What metrics would you track for a mobile app?'
        ],
        Behavioral: [
          'Describe a product you launched from concept to delivery.',
          'How do you handle conflicting stakeholder requirements?',
          'Tell me about a time when a product failed and what you learned.'
        ]
      },
      'UI/UX Designer': {
        Technical: [
          'Explain your design process from research to final mockups.',
          'How do you ensure accessibility in your designs?',
          'What tools do you use for prototyping and why?'
        ],
        Behavioral: [
          'Describe a time when you had to defend your design decisions.',
          'How do you incorporate user feedback into your designs?',
          'Tell me about a challenging design problem you solved.'
        ]
      }
    };

    const roleQuestions = questionBank[jobRole] || questionBank['Software Developer'];
    const questions = [];

    // Mix different categories
    const categories = Object.keys(roleQuestions);
    let questionIndex = 0;

    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const categoryQuestions = roleQuestions[category];
      const question = categoryQuestions[questionIndex % categoryQuestions.length];
      
      questions.push({
        questionText: question,
        category: category,
        difficulty: difficulty,
        expectedKeywords: this.extractKeywords(question, jobRole)
      });
      
      questionIndex++;
    }

    return questions;
  }

  // Extract keywords from question for answer evaluation
  static extractKeywords(question, jobRole) {
    const keywords = {
      'REST': ['REST', 'HTTP', 'API', 'endpoint', 'stateless'],
      'GraphQL': ['GraphQL', 'query', 'mutation', 'schema'],
      'binary search': ['O(log n)', 'sorted', 'divide', 'conquer'],
      'SOLID': ['Single Responsibility', 'Open-Closed', 'Liskov', 'Interface', 'Dependency'],
      'closures': ['scope', 'function', 'lexical', 'encapsulation'],
      'SQL': ['relational', 'ACID', 'joins', 'normalized'],
      'NoSQL': ['document', 'key-value', 'scalability', 'flexible schema']
    };

    for (const [key, values] of Object.entries(keywords)) {
      if (question.toLowerCase().includes(key.toLowerCase())) {
        return values;
      }
    }

    return ['relevant', 'experience', 'example', 'approach'];
  }

  // Analyze answer and provide score
  static analyzeAnswer(answer, expectedKeywords, category) {
    if (!answer || answer.trim().length < 20) {
      return {
        score: 20,
        feedback: 'Answer is too short. Please provide more detailed responses.'
      };
    }

    const answerLower = answer.toLowerCase();
    let score = 40; // Base score for attempting

    // Check for keywords
    let keywordMatches = 0;
    expectedKeywords.forEach(keyword => {
      if (answerLower.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });

    score += (keywordMatches / expectedKeywords.length) * 40;

    // Length bonus
    if (answer.length > 100) score += 10;
    if (answer.length > 200) score += 10;

    score = Math.min(score, 100);

    let feedback = '';
    if (score >= 80) {
      feedback = 'Excellent answer! You covered the key concepts well.';
    } else if (score >= 60) {
      feedback = 'Good answer, but could include more details about: ' + 
                 expectedKeywords.slice(0, 2).join(', ');
    } else {
      feedback = 'Consider elaborating on: ' + expectedKeywords.join(', ');
    }

    return { score: Math.round(score), feedback };
  }

  // Analyze speech patterns (mock implementation)
  static analyzeSpeech(transcript) {
    const words = transcript.split(' ');
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
    
    let fillerCount = 0;
    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = transcript.match(regex);
      if (matches) fillerCount += matches.length;
    });

    const wordsPerMinute = words.length; // Simplified
    let pace = 'moderate';
    if (wordsPerMinute < 100) pace = 'slow';
    if (wordsPerMinute > 160) pace = 'fast';

    const clarity = Math.max(0, 100 - (fillerCount * 5));

    return {
      tone: 'confident',
      clarity: clarity,
      pace: pace,
      fillerWords: fillerCount,
      wordsPerMinute: wordsPerMinute
    };
  }

  // Analyze facial expressions (mock implementation)
  static analyzeFacialExpression() {
    // In production, integrate with computer vision API
    return {
      confidence: Math.floor(Math.random() * 20) + 75,
      engagement: Math.floor(Math.random() * 20) + 75,
      emotions: ['focused', 'confident', 'engaged']
    };
  }

  // Generate comprehensive feedback
  static generateFeedback(interview) {
    const { scores, audioAnalysis, facialAnalysis } = interview;
    
    const strengths = [];
    const improvements = [];

    // Analyze scores
    if (scores.technical >= 75) strengths.push('Strong technical knowledge');
    else improvements.push('Review core technical concepts');

    if (scores.communication >= 75) strengths.push('Excellent communication skills');
    else improvements.push('Practice articulating thoughts more clearly');

    if (scores.confidence >= 75) strengths.push('Confident presentation');
    else improvements.push('Work on building confidence through practice');

    // Audio analysis
    if (audioAnalysis && audioAnalysis.fillerWords < 5) {
      strengths.push('Minimal use of filler words');
    } else if (audioAnalysis && audioAnalysis.fillerWords > 10) {
      improvements.push('Reduce filler words (um, uh, like)');
    }

    // Facial analysis
    if (facialAnalysis && facialAnalysis.engagement >= 75) {
      strengths.push('High engagement and attentiveness');
    }

    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
    
    let summary = '';
    if (avgScore >= 80) {
      summary = 'Outstanding performance! You demonstrated strong skills across all areas. Keep up the excellent work.';
    } else if (avgScore >= 65) {
      summary = 'Good performance overall. Focus on the improvement areas to reach the next level.';
    } else {
      summary = 'You have potential. Practice more interviews and focus on the key improvement areas.';
    }

    return {
      strengths,
      improvements,
      summary
    };
  }

  // Parse resume (mock implementation)
  static parseResume(filename) {
    // In production, use PDF parsing libraries or OCR
    return {
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python'],
      experience: '2 years',
      education: 'Bachelor of Technology in Computer Science',
      summary: 'Passionate software developer with experience in full-stack development'
    };
  }
}

module.exports = AIService;
