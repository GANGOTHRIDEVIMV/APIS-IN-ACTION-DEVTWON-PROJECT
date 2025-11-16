import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { FaUser, FaShare, FaBell, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { interviewService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await interviewService.getAnalytics();
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const workstageData = [
    { name: 'Completed', value: 85, color: '#6366f1' },
    { name: 'In Progress', value: 15, color: '#f59e0b' },
  ];

  const radarData = analytics?.aiVideoScore ? [
    { subject: 'Professionalism', score: analytics.aiVideoScore.breakdown.professionalism || 0 },
    { subject: 'Creativity', score: analytics.aiVideoScore.breakdown.creativity || 0 },
    { subject: 'Critical Thinking', score: analytics.aiVideoScore.breakdown.criticalThinking || 0 },
    { subject: 'Leadership', score: analytics.aiVideoScore.breakdown.leadership || 0 },
    { subject: 'Teamwork', score: analytics.aiVideoScore.breakdown.teamwork || 0 },
    { subject: 'Communication', score: analytics.aiVideoScore.breakdown.communication || 0 },
    { subject: 'Attitude', score: analytics.aiVideoScore.breakdown.attitude || 0 },
  ] : [];

  const interviewScore = analytics?.aiVideoScore?.totalScore || 0;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-circle">AI</div>
            <span className="logo-text">Interview UX Designer</span>
          </div>
        </div>
        <div className="header-right">
          <button className="btn btn-ai-tools">
            <span className="ai-icon">✨</span> AI-Tools
          </button>
          <button className="btn btn-share">
            <FaShare /> Share
          </button>
          <button className="btn btn-icon">
            <FaBell />
          </button>
          <div className="user-avatar">
            <img src={user?.profileImage || '/default-avatar.png'} alt={user?.name} />
            <span className="user-name">Izumi Wataya</span>
          </div>
        </div>
      </div>

      <Container fluid className="dashboard-content">
        <Row>
          {/* Left Column - Video and Candidate List */}
          <Col lg={6} className="left-column">
            {/* Video Section */}
            <Card className="video-card">
              <div className="video-container">
                <div className="video-placeholder">
                  <img
                    src="https://via.placeholder.com/600x400/e5e7eb/6366f1?text=Interview+Recording"
                    alt="Interview"
                    className="video-thumbnail"
                  />
                  <div className="video-controls">
                    <button className="btn-control">◀◀</button>
                    <button className="btn-control btn-play">▶</button>
                    <button className="btn-control">▶▶</button>
                  </div>
                  <div className="recording-badge">
                    <span className="recording-dot"></span>
                    Recording
                  </div>
                </div>
                <div className="video-tabs">
                  <button className="tab-btn active">Summary</button>
                  <button className="tab-btn">Transcript</button>
                  <button className="tab-btn">Information</button>
                </div>
              </div>
            </Card>

            {/* Workstage Score */}
            <Card className="workstage-card">
              <Card.Body>
                <div className="chart-container">
                  <div className="pie-chart-section">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie
                          data={workstageData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {workstageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-center-text">
                      <div className="score-value">85/100</div>
                      <div className="score-label">Workstage Score</div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Candidate List */}
            <Card className="candidate-card">
              <Card.Body>
                <h6 className="card-title">Candidate</h6>
                <div className="candidate-list">
                  {[
                    { name: 'Donal Rocha', status: 'warning', score: '85/100' },
                    { name: 'Shanna Bacend', status: 'danger', score: '72/100' },
                    { name: 'Roberta Sanyes', status: 'success', score: '91/100' },
                    { name: 'Shanna Sanchus', status: 'warning', score: '78/100' },
                  ].map((candidate, index) => (
                    <div key={index} className="candidate-item">
                      <div className="candidate-info">
                        <div className="candidate-avatar">
                          <img src={`https://i.pravatar.cc/40?img=${index + 1}`} alt={candidate.name} />
                        </div>
                        <span className="candidate-name">{candidate.name}</span>
                      </div>
                      <Badge bg={candidate.status} className="candidate-badge">
                        {candidate.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Question and Scores */}
          <Col lg={6} className="right-column">
            {/* Question Card */}
            <Card className="question-card">
              <Card.Body>
                <div className="question-header">
                  <h6>Question {currentQuestion}</h6>
                  <div className="question-nav">
                    <button
                      className="btn-nav"
                      onClick={() => setCurrentQuestion(Math.max(1, currentQuestion - 1))}
                      disabled={currentQuestion === 1}
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      className="btn-nav"
                      onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
                <p className="question-text">
                  Describe a time when your initial design didn't solve the user's problem. How did you identify the issue and what steps did you take to improve it?
                </p>
              </Card.Body>
            </Card>

            {/* AI Video Score Radar */}
            <Card className="radar-card">
              <Card.Body>
                <h6 className="card-title">AI Video Score</h6>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#ec4899"
                      fill="#ec4899"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>

            {/* Interview Score */}
            <Card className="score-card">
              <Card.Body>
                <div className="score-header">
                  <h6>Interview Score</h6>
                  <Badge bg="success">Matched</Badge>
                </div>
                <div className="score-display">
                  <div className="score-number">{interviewScore}<span className="score-max">%</span></div>
                </div>
                <div className="score-summary">
                  <p className="score-label">AI Video Score Summary</p>
                  <p className="score-description">
                    Based on communication, technical knowledge, and behavioral assessment
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;
