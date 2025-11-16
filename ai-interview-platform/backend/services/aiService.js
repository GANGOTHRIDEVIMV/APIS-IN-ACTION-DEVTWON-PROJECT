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
