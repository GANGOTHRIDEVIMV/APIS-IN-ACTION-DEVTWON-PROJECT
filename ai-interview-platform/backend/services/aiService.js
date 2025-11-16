const OpenAI = require('openai');
const natural = require('natural');
const sentiment = require('sentiment');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sentimentAnalyzer = new sentiment();
const tokenizer = new natural.WordTokenizer();

class AIService {
  // Generate interview questions based on job role and difficulty
  async generateQuestions(jobRole, difficulty, resumeText, previousAnswers = []) {
    try {
      let difficultyLevel = 'intermediate';

      // Adjust difficulty based on previous performance
      if (previousAnswers.length > 0) {
        const avgScore = previousAnswers.reduce((sum, ans) => sum + ans.scores.contentScore, 0) / previousAnswers.length;
        if (avgScore > 80) difficultyLevel = 'advanced';
        else if (avgScore < 50) difficultyLevel = 'beginner';
      } else {
        difficultyLevel = difficulty;
      }

      const prompt = `Generate 3 interview questions for a ${jobRole} position at ${difficultyLevel} difficulty level.

Resume context: ${resumeText ? resumeText.substring(0, 500) : 'No resume provided'}

Previous answers context: ${previousAnswers.length > 0 ? 'Candidate has answered ' + previousAnswers.length + ' questions' : 'First questions'}

Requirements:
1. Mix technical, behavioral, and situational questions
2. Questions should be relevant to ${jobRole}
3. Difficulty: ${difficultyLevel}
4. Each question should test different aspects of the role

Return ONLY a JSON array with this format:
[
  {
    "question": "Your question here",
    "category": "technical|behavioral|situational",
    "expectedKeywords": ["keyword1", "keyword2"],
    "difficulty": "${difficultyLevel}"
  }
]`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interviewer who creates insightful, relevant interview questions. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const questionsText = completion.choices[0].message.content.trim();
      const questions = JSON.parse(questionsText);

      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions');
    }
  }

  // Analyze answer quality
  async analyzeAnswer(question, answer, expectedKeywords = []) {
    try {
      const prompt = `Analyze this interview answer and provide detailed feedback.

Question: ${question}
Answer: ${answer}
Expected keywords: ${expectedKeywords.join(', ')}

Provide analysis in this JSON format:
{
  "contentScore": 0-100,
  "communicationScore": 0-100,
  "clarityScore": 0-100,
  "confidenceScore": 0-100,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "keywordsUsed": ["keyword1", "keyword2"],
  "overallFeedback": "Brief overall feedback"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview evaluator. Provide constructive, specific feedback. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const analysisText = completion.choices[0].message.content.trim();
      const analysis = JSON.parse(analysisText);

      // Add sentiment analysis
      const sentimentResult = sentimentAnalyzer.analyze(answer);
      analysis.sentiment = sentimentResult.score > 0 ? 'positive' : sentimentResult.score < 0 ? 'negative' : 'neutral';
      analysis.sentimentScore = sentimentResult.score;

      return analysis;
    } catch (error) {
      console.error('Error analyzing answer:', error);
      throw new Error('Failed to analyze answer');
    }
  }

  // Analyze speech patterns
  analyzeSpeech(transcriptText, duration) {
    try {
      const words = tokenizer.tokenize(transcriptText);
      const wordCount = words.length;
      const wordsPerMinute = (wordCount / duration) * 60;

      let pace = 'normal';
      if (wordsPerMinute < 100) pace = 'slow';
      else if (wordsPerMinute > 160) pace = 'fast';

      // Fluency score based on filler words
      const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
      let fillerCount = 0;
      words.forEach(word => {
        if (fillerWords.includes(word.toLowerCase())) fillerCount++;
      });

      const fluencyScore = Math.max(0, 100 - (fillerCount / wordCount) * 100);

      return {
        wordCount,
        wordsPerMinute: Math.round(wordsPerMinute),
        pace,
        fluency: Math.round(fluencyScore),
        fillerWordsCount: fillerCount,
      };
    } catch (error) {
      console.error('Error analyzing speech:', error);
      return {
        wordCount: 0,
        wordsPerMinute: 0,
        pace: 'unknown',
        fluency: 50,
        fillerWordsCount: 0,
      };
    }
  }

  // Generate overall interview feedback
  async generateOverallFeedback(interviewData) {
    try {
      const { jobRole, answers, overallScores } = interviewData;

      const prompt = `Generate comprehensive interview feedback for a ${jobRole} candidate.

Overall Scores:
- Technical: ${overallScores.technicalScore}/100
- Communication: ${overallScores.communicationScore}/100
- Behavioral: ${overallScores.behavioralScore}/100
- Overall: ${overallScores.overallScore}/100

Number of questions answered: ${answers.length}

Provide detailed feedback in this JSON format:
{
  "overallAssessment": "Overall assessment in 2-3 sentences",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "readinessLevel": "Not Ready|Needs Practice|Ready|Highly Ready"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a senior HR professional providing constructive interview feedback. Be specific and actionable. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 600,
      });

      const feedbackText = completion.choices[0].message.content.trim();
      const feedback = JSON.parse(feedbackText);

      return feedback;
    } catch (error) {
      console.error('Error generating feedback:', error);
      throw new Error('Failed to generate feedback');
    }
  }

  // Parse resume text
  async parseResume(resumeText) {
    try {
      const prompt = `Extract key information from this resume:

${resumeText}

Return ONLY a JSON object with this format:
{
  "name": "Candidate name",
  "email": "email@example.com",
  "phone": "phone number",
  "skills": ["skill1", "skill2"],
  "experience": "years of experience as number",
  "education": {
    "degree": "degree name",
    "institution": "institution name",
    "year": year
  },
  "summary": "Brief professional summary"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume parser. Extract structured information accurately. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 600,
      });

      const parsedText = completion.choices[0].message.content.trim();
      const parsedData = JSON.parse(parsedText);

      return parsedData;
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw new Error('Failed to parse resume');
    }
  }
}

module.exports = new AIService();
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
