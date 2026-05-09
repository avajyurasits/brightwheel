import { useState, useCallback } from 'react'
import { SYSTEM_PROMPT, SAMPLE_MESSAGES } from './triageConfig'
import './App.css'

const PRIORITY_CONFIG = {
  'P1 - Critical': { color: '#ff3b30', bg: '#fff1f0', label: 'P1 CRITICAL', dot: '#ff3b30' },
  'P2 - High': { color: '#ff9500', bg: '#fff8ee', label: 'P2 HIGH', dot: '#ff9500' },
  'P3 - Normal': { color: '#34c759', bg: '#f0fff4', label: 'P3 NORMAL', dot: '#34c759' },
}

const FLAG_CONFIG = {
  'ESCALATE_IMMEDIATELY': { bg: '#ff3b30', text: '#fff' },
  'DATA_BREACH_RISK': { bg: '#ff3b30', text: '#fff' },
  'CHURN_RISK': { bg: '#ff6b35', text: '#fff' },
  'NEEDS_CLARIFICATION': { bg: '#007aff', text: '#fff' },
  'POSSIBLE_DUPLICATE': { bg: '#8e8e93', text: '#fff' },
  'UPSELL_OPPORTUNITY': { bg: '#34c759', text: '#fff' },
  'WRONG_TEAM': { bg: '#8e8e93', text: '#fff' },
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className="copy-btn" onClick={handleCopy}>
      {copied ? '✓ Copied' : 'Copy reply'}
    </button>
  )
}

function TriageResult({ result }) {
  const priority = PRIORITY_CONFIG[result.priority] || PRIORITY_CONFIG['P3 - Normal']

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="priority-badge" style={{ background: priority.bg, color: priority.color }}>
          <span className="priority-dot" style={{ background: priority.dot }} />
          {priority.label}
        </div>
        <div className={`confidence-badge conf-${result.confidence?.toLowerCase()}`}>
          {result.confidence} confidence
        </div>
      </div>

      {result.flags && result.flags.length > 0 && (
        <div className="flags-row">
          {result.flags.map(flag => {
            const fc = FLAG_CONFIG[flag] || { bg: '#636366', text: '#fff' }
            return (
              <span key={flag} className="flag-chip" style={{ background: fc.bg, color: fc.text }}>
                {flag.replace(/_/g, ' ')}
              </span>
            )
          })}
        </div>
      )}

      <div className="result-grid">
        <div className="result-field">
          <div className="field-label">Category</div>
          <div className="field-value">{result.category}</div>
        </div>
        <div className="result-field">
          <div className="field-label">Route To</div>
          <div className="field-value routing">{result.routing}</div>
          {result.routing_reason && (
            <div className="field-sub">{result.routing_reason}</div>
          )}
        </div>
        <div className="result-field full-width">
          <div className="field-label">Priority Reasoning</div>
          <div className="field-value muted">{result.priority_reason}</div>
        </div>
        {result.confidence_note && (
          <div className="result-field full-width">
            <div className="field-label">⚠ Confidence Note</div>
            <div className="field-value muted">{result.confidence_note}</div>
          </div>
        )}
      </div>

      <div className="reply-section">
        <div className="reply-header">
          <div className="field-label">Draft Reply</div>
          <CopyButton text={result.draft_reply} />
        </div>
        <div className="reply-body">{result.draft_reply}</div>
      </div>
    </div>
  )
}

export default function App() {
  const [sender, setSender] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('triage')
  const [history, setHistory] = useState([])

  const loadSample = (msg) => {
    setSender(msg.sender)
    setEmail(msg.email)
    setSubject(msg.subject)
    setBody(msg.body)
    setResult(null)
    setError(null)
  }

  const handleSubmit = useCallback(async () => {
    if (!body.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)

    const userMessage = `Please triage this inbound message:

Sender: ${sender || 'Unknown'}
Email: ${email || 'Unknown'}
Subject: ${subject || '(no subject)'}
Body:
${body}`

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }]
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || `API error ${response.status}`)
      }

      const data = await response.json()
      const text = data.content[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setResult(parsed)
      setHistory(prev => [{
        id: Date.now(),
        sender: sender || 'Unknown',
        subject: subject || '(no subject)',
        priority: parsed.priority,
        category: parsed.category,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sender, email, subject, body])

  const clearForm = () => {
    setSender(''); setEmail(''); setSubject(''); setBody('')
    setResult(null); setError(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-area">
            <div className="logo-mark">BW</div>
            <div>
              <div className="logo-title">Onboarding Triage</div>
              <div className="logo-sub">AI-powered message routing</div>
            </div>
          </div>
          <nav className="tab-nav">
            <button className={`tab-btn ${activeTab === 'triage' ? 'active' : ''}`} onClick={() => setActiveTab('triage')}>
              Triage
            </button>
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              History {history.length > 0 && <span className="badge">{history.length}</span>}
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'triage' && (
          <div className="triage-layout">
            <div className="input-panel">
              <div className="panel-title">Inbound Message</div>

              <div className="samples-section">
                <div className="samples-label">Load sample</div>
                <div className="samples-grid">
                  {SAMPLE_MESSAGES.map(msg => {
                    const pc = PRIORITY_CONFIG[
                      msg.id === 'MSG-002' || msg.id === 'MSG-010' || msg.id === 'MSG-025' || msg.id === 'MSG-018'
                        ? 'P1 - Critical'
                        : msg.id === 'MSG-017'
                        ? 'P2 - High'
                        : 'P3 - Normal'
                    ]
                    return (
                      <button key={msg.id} className="sample-chip" onClick={() => loadSample(msg)}
                        style={{ borderColor: pc.dot + '44' }}>
                        <span className="sample-dot" style={{ background: pc.dot }} />
                        <span>{msg.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Sender Name</label>
                  <input value={sender} onChange={e => setSender(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div className="form-group">
                  <label>Sender Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@school.org" type="email" />
                </div>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. URGENT - parents cannot log in" />
              </div>

              <div className="form-group">
                <label>Message Body <span className="required">*</span></label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Paste the full message body here..."
                  rows={10}
                />
              </div>

              <div className="form-actions">
                <button className="btn-clear" onClick={clearForm}>Clear</button>
                <button
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={loading || !body.trim()}
                >
                  {loading ? (
                    <span className="loading-inner">
                      <span className="spinner" />
                      Analyzing…
                    </span>
                  ) : 'Run Triage →'}
                </button>
              </div>
            </div>

            <div className="output-panel">
              <div className="panel-title">Triage Output</div>
              {!result && !loading && !error && (
                <div className="empty-state">
                  <div className="empty-icon">◈</div>
                  <div className="empty-text">Submit a message to see the triage result</div>
                  <div className="empty-sub">Classification · Priority · Routing · Draft reply</div>
                </div>
              )}
              {loading && (
                <div className="loading-state">
                  <div className="loading-pulse" />
                  <div className="loading-text">Processing message…</div>
                </div>
              )}
              {error && (
                <div className="error-state">
                  <div className="error-title">Error</div>
                  <div className="error-msg">{error}</div>
                </div>
              )}
              {result && <TriageResult result={result} />}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-panel">
            <div className="panel-title">Triage History <span className="panel-sub">— this session</span></div>
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <div className="empty-text">No messages triaged yet</div>
              </div>
            ) : (
              <div className="history-list">
                {history.map(item => {
                  const pc = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG['P3 - Normal']
                  return (
                    <div key={item.id} className="history-item">
                      <div className="history-priority" style={{ background: pc.bg, color: pc.color }}>
                        <span className="priority-dot" style={{ background: pc.dot }} />
                        {pc.label}
                      </div>
                      <div className="history-content">
                        <div className="history-sender">{item.sender}</div>
                        <div className="history-subject">{item.subject}</div>
                        <div className="history-category">{item.category}</div>
                      </div>
                      <div className="history-time">{item.timestamp}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
