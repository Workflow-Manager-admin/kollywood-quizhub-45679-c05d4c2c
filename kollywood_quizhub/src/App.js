import React, { useState, useEffect } from 'react';
import './App.css';
import {
  fetchKollywoodMovies,
  fetchMovieDetails,
  searchKollywoodMovies,
} from './tmdbApi';

// Simple in-memory user database for demo (no backend)
const INIT_USERS = [
  { username: "demo", password: "demo", progress: [], results: [] }
];

function App() {
  const [route, setRoute] = useState('login'); // 'login', 'quiz', 'result'
  const [user, setUser] = useState(null); // { username, ... }
  const [users, setUsers] = useState(() => INIT_USERS.slice());
  const [loginErr, setLoginErr] = useState('');
  const [registerMode, setRegisterMode] = useState(false);

  const [quizData, setQuizData] = useState(null); // { questions: [...], ... }
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0); // Index in quiz questions
  const [answers, setAnswers] = useState([]);
  const [quizType, setQuizType] = useState('movie-title-poster'); // Fixed for simplicity

  // Fetch movies for quiz
  const loadQuiz = async () => {
    setLoadingQuiz(true);
    setQuizData(null);
    setQuizIndex(0);
    setAnswers([]);
    try {
      // Fetch 2 pages (~40 Tamil movies) and randomize
      const [res1, res2] = await Promise.all([
        fetchKollywoodMovies(1),
        fetchKollywoodMovies(2)
      ]);
      let movies = [...res1.results, ...res2.results].filter(m =>
        m.poster_path && m.title && m.overview
      );
      // Remove duplicates (in rare TMDb cases)
      movies = Array.from(new Map(movies.map(m => [m.id, m])).values());
      // Shuffle
      shuffleArray(movies);
      // Generate questions (e.g., show poster, ask for title)
      const questions = movies.slice(0, 10).map((movie, idx) => {
        return {
          id: movie.id,
          poster: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
          title: movie.title,
          overview: movie.overview,
          correct: movie.title,
          options: shuffleArray([
            movie.title,
            ...pickRandom(movies.filter(x => x.id !== movie.id).map(x => x.title), 3)
          ])
        };
      });
      setQuizData({ questions });
      setLoadingQuiz(false);
    } catch (e) {
      setQuizData(null);
      setLoadingQuiz(false);
      alert("Failed to load quiz. Try again in a moment.");
    }
  };

  // Handle user login/registration (no backend)
  function handleLogin(username, password, reg) {
    setLoginErr('');
    const uname = username.trim();
    if (!uname || !password) {
      setLoginErr('Username and password required');
      return;
    }
    let u = users.find(u => u.username === uname);
    if (reg) {
      if (u) {
        setLoginErr('Username already taken');
        return;
      }
      u = { username: uname, password, progress: [], results: [] };
      setUsers(prev => [...prev, u]);
      setUser(u);
      setRoute('quiz');
      setLoginErr('');
      setRegisterMode(false);
      return;
    }
    // login
    if (!u || u.password !== password) {
      setLoginErr('Invalid credentials');
      return;
    }
    setUser(u);
    setRoute('quiz');
    setLoginErr('');
  }

  // Handle quiz answer
  function handleAnswer(answer) {
    const currentQ = quizData.questions[quizIndex];
    const isCorrect = answer === currentQ.correct;
    setAnswers(prev => [...prev, { questionId: currentQ.id, answer, isCorrect }]);
    if (quizIndex < quizData.questions.length - 1) {
      setQuizIndex(idx => idx + 1);
    } else {
      // Save result to user DB
      handleSaveResult([...answers, { questionId: currentQ.id, answer, isCorrect }]);
      setRoute('result');
    }
  }

  // Restart quiz
  function handleRestart() {
    setAnswers([]);
    setQuizIndex(0);
    setRoute('quiz');
    loadQuiz();
  }

  // Store quiz result to user
  function handleSaveResult(finalAnswers) {
    if (!user) return;
    const total = finalAnswers.length;
    const correct = finalAnswers.filter(ans => ans.isCorrect).length;
    const resultObj = {
      timestamp: Date.now(),
      quizType,
      total,
      correct,
    };
    // Persist to users array
    setUsers(old =>
      old.map(u =>
        u.username === user.username
          ? {
              ...u,
              results: [...(u.results || []), resultObj],
              progress: [...(u.progress || []), resultObj],
            }
          : u
      )
    );
    // Update user session
    setUser(u =>
      u
        ? {
            ...u,
            results: [...(u.results || []), resultObj],
            progress: [...(u.progress || []), resultObj],
          }
        : null
    );
  }

  useEffect(() => {
    if (route === 'quiz') {
      loadQuiz();
    }
    // eslint-disable-next-line
  }, [route]);

  // Navigation functions
  function handleLogout() {
    setUser(null);
    setRoute('login');
    setAnswers([]);
    setQuizData(null);
    setQuizIndex(0);
    setQuizType('movie-title-poster');
  }
  function handleBack() {
    if (route === 'result') {
      setRoute('quiz');
      setQuizIndex(0);
      setAnswers([]);
      loadQuiz();
    } else if (route === 'quiz' && quizIndex > 0) {
      setQuizIndex(q => q - 1);
      setAnswers(prev => prev.slice(0, -1));
    }
  }

  // -- Renderers --

  // Login/Register form
  function renderLogin() {
    let uname = '';
    let pwd = '';
    return (
      <div className="container" style={{ marginTop: "120px" }}>
        <div className="hero" style={{ maxWidth: 360 }}>
          <div className="subtitle">Welcome to</div>
          <h1 className="title" style={{ fontSize: "2.2rem" }}>Kollywood QuizHub</h1>
          <div className="description">Test your Tamil cinema knowledge.<br />Login or Register to get started.</div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(uname, pwd, registerMode);
            }}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
          >
            <input
              type="text"
              placeholder="Username"
              style={inputStyle}
              required
              autoFocus
              onChange={e => (uname = e.target.value)}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Password"
              style={inputStyle}
              required
              onChange={e => (pwd = e.target.value)}
              autoComplete={registerMode ? 'new-password' : 'current-password'}
            />
            <button className="btn btn-large" type="submit">
              {registerMode ? "Register" : "Login"}
            </button>
            <button
              type="button"
              style={flatLinkStyle}
              onClick={() => {
                setRegisterMode((reg) => !reg);
                setLoginErr("");
              }}>
              {registerMode ? "Already have an account? Login" : "New user? Register"}
            </button>
            {loginErr && <div style={{ color: "#fd088a", marginTop: 6 }}>{loginErr}</div>}
          </form>
          <div style={{ color: '#888', fontSize: "0.96em", marginTop: 8 }}>
            Demo login: <span style={{ color: '#fff', letterSpacing: 0.5 }}>demo/demo</span>
          </div>
        </div>
      </div>
    );
  }

  // Quiz question display
  function renderQuiz() {
    if (loadingQuiz || !quizData) {
      return (
        <div className="container" style={{ marginTop: "140px", textAlign: "center" }}>
          <div className="hero">
            <div className="subtitle">Loading your Kollywood Quiz…</div>
            <div style={{ fontSize: 38, margin: 40 }} aria-label="loading">🎬</div>
            <div style={{ color: "#fd088a" }}>Please wait a few seconds…</div>
          </div>
        </div>
      );
    }
    const q = quizData.questions[quizIndex];
    // Make answers not repeat if next/back, option order is fixed for that question (pre-shuffled).
    return (
      <div className="container" style={{ marginTop: "112px", maxWidth: 510 }}>
        <div style={quizCardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={quizSubTitleStyle}>{`Question ${quizIndex + 1} of ${quizData.questions.length}`}</span>
          </div>
          <div>
            <img src={q.poster} alt="Movie poster" style={posterStyle} />
          </div>
          <div style={{ fontWeight: 600, margin: "22px 0 8px", fontSize: "1.15rem" }}>
            What is the title of this Kollywood movie?
          </div>
          <div style={{ marginBottom: 14, color: "#bbb", fontSize: "1em" }}>
            <em>Clue: {q.overview.slice(0, 60) + "…"} </em>
          </div>
          <div style={{ display: 'flex', flexDirection: "column", gap: 12 }}>
            {q.options.map(option => (
              <button
                className="btn btn-large"
                key={option}
                style={{
                  backgroundColor:
                    answers[quizIndex] && answers[quizIndex].answer === option
                      ? "#fd088a"
                      : undefined,
                  border: "none"
                }}
                tabIndex={0}
                onClick={() => handleAnswer(option)}
                disabled={answers[quizIndex]}
              >{option}</button>
            ))}
          </div>
          <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', width: "100%" }}>
            <button
              className="btn"
              style={{ background: "#222", color: "#fff" }}
              onClick={handleBack}
              disabled={quizIndex === 0}
            >Back</button>
            <button
              className="btn"
              style={{ background: "#080808", color: "#fff" }}
              onClick={handleLogout}
            >Logout</button>
          </div>
        </div>
        <QuizProgressBar value={quizIndex + (answers[quizIndex] ? 1 : 0)} max={quizData.questions.length} />
      </div>
    );
  }

  // Result/score page
  function renderResult() {
    const numCorrect = answers.filter(ans => ans.isCorrect).length;
    return (
      <div className="container" style={{ marginTop: 110, maxWidth: 520 }}>
        <div style={quizCardStyle}>
          <div style={{ fontSize: "1.1rem", color: "#fd088a" }}>
            Quiz Complete!
          </div>
          <h2 style={{
            fontSize: "2rem",
            fontWeight: 700,
            margin: "20px 0 8px"
          }}>
            {numCorrect} / {answers.length} Correct
          </h2>
          <div style={{ marginBottom: 18, fontSize: "1.03em" }}>
            {numCorrect >= 7
              ? <>🏆 <span style={{ color: "#03da9a" }}>Excellent Kollywood knowledge!</span></>
              : numCorrect >= 4
                ? <>👏 <span style={{ color: "#7fd1ff" }}>Good job! Try again for a higher score.</span></>
                : <>🎬 <span style={{ color: "#fd088a" }}>Keep watching, Kollywood star in the making!</span></>
            }
          </div>
          <ul style={{ textAlign: "left", paddingLeft: 8 }}>
            {quizData.questions.map((q, idx) => (
              <li key={q.id} style={{ margin: "6px 0" }}>
                <span style={{
                  color: answers[idx]?.isCorrect ? "#03da9a" : "#fd088a",
                  fontWeight: 600,
                  fontSize: "1.08em",
                  marginRight: 8
                }}>
                  {answers[idx]?.isCorrect ? "✓" : "✗"}
                </span>
                {q.title}
                <span style={{
                  color: "#bbb",
                  fontSize: "0.95em",
                  marginLeft: 10
                }}>
                  ({q.overview.slice(0, 48)}…)
                </span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
            <button className="btn btn-large" onClick={handleRestart}>Try Again</button>
            <button className="btn btn-large" style={{ background: "#aaa", color: "#222" }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <UserProgressPanel user={user} />
      </div>
    );
  }

  // Main NavBar
  function renderNavbar() {
    return (
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: "center" }}>
            <div className="logo">
              <span className="logo-symbol" role="img" aria-label="clap">🎬</span>
              Kollywood QuizHub
            </div>
            {user && (
              <div style={{
                background: '#fd088a',
                color: '#fff',
                padding: "5px 15px",
                borderRadius: 22,
                fontWeight: 600,
                fontSize: "1em",
                letterSpacing: 0.2
              }}>
                {user.username}
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Main content router
  function renderMain() {
    if (!user) return renderLogin();
    if (route === 'quiz') return renderQuiz();
    if (route === 'result') return renderResult();
    return <div />;
  }

  // --- JSX Output ---
  return (
    <div className="app">
      {renderNavbar()}
      <main>
        {renderMain()}
      </main>
    </div>
  );
}

// --- Helper/mini components ---

/** Quiz progress bar visual */
function QuizProgressBar({ value, max }) {
  return (
    <div style={{ width: "100%", margin: "22px 0 0" }}>
      <div style={{
        height: 8, width: "100%", background: "#222", borderRadius: 5,
        overflow: "hidden"
      }}>
        <div style={{
          width: `${Math.max(0, Math.min(1, value / max)) * 100}%`,
          height: "100%",
          background: "#fd088a",
          transition: "width 0.3s"
        }} />
      </div>
      <div style={{
        fontSize: "0.93em", color: "#bbb",
        marginTop: 5, textAlign: "right"
      }}>
        {value} / {max}
      </div>
    </div>
  );
}

/** Show user's previous result and progress */
function UserProgressPanel({ user }) {
  if (!user || !(user.results && user.results.length)) return null;
  const last = user.results[user.results.length - 1];
  return (
    <div style={{
      marginTop: 36,
      padding: "18px 24px",
      background: "#080808",
      borderRadius: 8,
      color: "#fff",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)"
    }}>
      <div style={{ fontSize: "0.98em", color: "#fd088a" }}>
        Last Quiz Score
      </div>
      <div>Type: {last.quizType.replace(/-/g, " ")}</div>
      <div>Score: <b>{last.correct} / {last.total}</b></div>
      <div style={{ fontSize: "0.96em", color: "#999", marginTop: 7 }}>
        {user.results.length} quiz{user.results.length > 1 ? "zes" : ""} completed so far.
      </div>
    </div>
  );
}

// -- Utilities ---

function shuffleArray(arr) {
  // Returns a new shuffled array
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n) {
  // Returns n random elements from arr (shuffled)
  return shuffleArray(arr).slice(0, n);
}

// --- Styles ---
const inputStyle = {
  padding: "11px 13px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: "1.09em",
  background: "#222",
  color: "#fff",
  marginBottom: 3,
  outline: "none",
};
const flatLinkStyle = {
  color: "#fd088a",
  background: "none",
  border: "none",
  fontWeight: 500,
  fontSize: "1em",
  textAlign: "center",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  textDecoration: "underline"
};
const quizCardStyle = {
  background: "#191929",
  borderRadius: 13,
  padding: "34px 23px 24px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.16)",
  margin: "0 auto",
  width: "100%",
  maxWidth: 430,
};
const quizSubTitleStyle = {
  color: "#fd088a", fontWeight: 500, fontSize: "1.1em", letterSpacing: 0
};
const posterStyle = {
  width: 180,
  height: 260,
  objectFit: "cover",
  borderRadius: 7,
  boxShadow: "0 2px 6px #282830a9",
};

export default App;