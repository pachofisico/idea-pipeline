import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import CanvasDraw from 'react-canvas-draw'
import './index.css'

function App() {
  const [activeView, setActiveView] = useState('portafolio') // portafolio, nueva, proteger, prototipar

  // App State
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaDescription, setIdeaDescription] = useState('')
  const canvasRef = useRef(null)
  const [findings, setFindings] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [generatedIdeas, setGeneratedIdeas] = useState([])
  const [status, setStatus] = useState('idle') // researching, generating

  // Portfolio Mock Data
  const [portfolio, setPortfolio] = useState([
    { id: 1, title: 'Sistema de Energía Solar', type: 'Prototipo', image: 'solar' },
    { id: 2, title: 'Diseño UX/UI App Médica', type: 'Diseño', image: 'ux' },
    { id: 3, title: 'Plataforma de Cursos IA', type: 'Idea', image: 'ia' }
  ])

  // Handlers
  const handleStartResearch = async () => {
    if (!ideaTitle.trim()) return
    setStatus('researching')
    try {
      const query = `${ideaTitle} ${ideaDescription}`
      const response = await axios.post('http://localhost:3000/api/start', { query })
      setFindings(response.data.data)
      setActiveView('selection')
    } catch (error) {
      console.error(error)
      setStatus('idle')
      alert('Error en la conexión')
    }
  }

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return
    setStatus('generating')
    try {
      const selectedFindings = findings.filter(f => selectedIds.includes(f.id))
      const context = `Título: ${ideaTitle}. Descripción: ${ideaDescription}`
      const response = await axios.post('http://localhost:3000/api/generate-ideas', {
        selectedFindings,
        context
      })
      setGeneratedIdeas(response.data.ideas)
      setStatus('idle')
      setActiveView('resultados')
    } catch (error) {
      console.error(error)
      setStatus('idle')
      alert('Error generando ideas')
    }
  }

  const NavItem = ({ id, label, icon }) => (
    <div
      className={`nav-item ${activeView === id ? 'active' : ''}`}
      onClick={() => setActiveView(id)}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )

  return (
    <>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="user-profile">
          <div className="user-name">Francisco Javier<br />Martínez</div>
        </div>

        <nav className="nav-menu">
          <NavItem id="portafolio" label="Portafolio" icon="📁" />
          <NavItem id="nueva" label="Nueva Idea" icon="🚀" />
          <NavItem id="proteger" label="Proteger" icon="✒️" />
          <NavItem id="prototipapar" label="Prototipar" icon="🛠️" />

          <hr className="menu-divider" />

          <NavItem id="producir" label="Producir" icon="📦" />
          <NavItem id="vigilancia" label="Vigilancia de mercado" icon="🔍" />
          <NavItem id="oportunidades" label="Oportunidades" icon="✨" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-layout">
        <header>
          <h1>{activeView.charAt(0) + activeView.slice(1)}</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="icon-btn">⚙️</div>
            <div className="user-avatar" style={{ width: 32, height: 32, background: '#ccc', borderRadius: '50%' }}></div>
          </div>
        </header>

        <div className="content-container">

          {/* VIEW: PORTAFOLIO */}
          {activeView === 'portafolio' && (
            <div className="portfolio-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div className="search-bar" style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ddd', width: '300px' }}>
                  🔍 Buscar ideas...
                </div>
                <div className="filters">
                  <span className="status-pill">Todos</span>
                </div>
              </div>

              <div className="portfolio-grid">
                {portfolio.map(item => (
                  <div key={item.id} className="idea-card">
                    <div className="idea-thumb">
                      <div className="play-btn">▶</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div className="tag" style={{ fontSize: '0.7rem' }}>{item.type}</div>
                      <h3 style={{ margin: '0.5rem 0' }}>{item.title}</h3>
                    </div>
                  </div>
                ))}

                <div className="idea-card add-btn" onClick={() => setActiveView('nueva')}>
                  <div style={{ fontSize: '2rem' }}>+</div>
                  <div>Nueva idea</div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: NUEVA IDEA (Canvas) */}
          {activeView === 'nueva' && (
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <div className="hand-drawn-card">
                <h2 className="card-title-drawn">Nueva Idea</h2>

                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <label style={{ fontFamily: 'Gochi Hand' }}>Título de la Idea</label>
                  <input
                    className="input-drawn"
                    placeholder="Escribe aquí..."
                    value={ideaTitle}
                    onChange={e => setIdeaTitle(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <label style={{ fontFamily: 'Gochi Hand' }}>Lienzo Prototipo</label>
                  <div className="sketch-area">
                    <CanvasDraw
                      ref={canvasRef}
                      brushColor="#334"
                      backgroundColor="transparent"
                      canvasWidth={700}
                      canvasHeight={350}
                      brushRadius={2}
                      lazyRadius={0}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                  <label style={{ fontFamily: 'Gochi Hand' }}>Objetivo / Descripción</label>
                  <textarea
                    className="input-drawn"
                    style={{ height: '100px', resize: 'none' }}
                    placeholder="Describe tu visión..."
                    value={ideaDescription}
                    onChange={e => setIdeaDescription(e.target.value)}
                  />
                </div>

                <button className="btn-primary-drawn" onClick={handleStartResearch}>
                  Investigar y complementar
                </button>
              </div>
            </div>
          )}

          {/* VIEW: SELECTION (From Research) */}
          {activeView === 'selection' && (
            <div>
              <h2 className="card-title-drawn">Hallazgos de Investigación</h2>
              <div className="grid">
                {findings.map(f => (
                  <div
                    key={f.id}
                    className={`card ${selectedIds.includes(f.id) ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedIds(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])
                    }}
                  >
                    <div className="tag">{f.source}</div>
                    <h3>{f.title}</h3>
                    <p>{f.snippet}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button className="btn-primary-drawn" onClick={handleGenerate}>Generar Conceptos IA</button>
              </div>
            </div>
          )}

          {/* VIEW: PROTEGER */}
          {activeView === 'proteger' && (
            <div style={{ textAlign: 'center' }}>
              <h2 className="card-title-drawn">Estrategia de Protección</h2>
              <div style={{ background: '#fff9c4', padding: '1rem', display: 'inline-block', marginBottom: '2rem', boxShadow: '2px 2px 0 #334', fontFamily: 'Gochi Hand', fontSize: '1.2rem' }}>
                Determinar mejor estrategia
              </div>

              <div className="protect-grid">
                <div className="protect-card">
                  <div className="protect-icon">💡</div>
                  <h3>Patente</h3>
                </div>
                <div className="protect-card">
                  <div className="protect-icon">®️</div>
                  <h3>Marca</h3>
                </div>
                <div className="protect-card">
                  <div className="protect-icon">🎨</div>
                  <h3>Diseño</h3>
                </div>
                <div className="protect-card">
                  <div className="protect-icon">🔒</div>
                  <h3>Secreto</h3>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: RESULTADOS (Generated Ideas) */}
          {activeView === 'resultados' && (
            <div className="grid">
              {generatedIdeas.map((idea, idx) => (
                <div key={idx} className="idea-card">
                  <div className="tag">IA Sugerencia</div>
                  <h3>{idea.title}</h3>
                  <p>{idea.description}</p>
                  <div className="analysis-box">{idea.analysis}</div>
                </div>
              ))}
              <div className="idea-card add-btn" onClick={() => setActiveView('portafolio')}>
                Regresar al Portafolio
              </div>
            </div>
          )}

          {/* Status Overlay */}
          {(status === 'researching' || status === 'generating') && (
            <div className="status-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: 'white' }}>
              <div className="loader"></div>
              <div style={{ marginTop: '1rem', fontSize: '1.5rem', fontFamily: 'Gochi Hand' }}>
                {status === 'researching' ? 'Investigando...' : 'Generando ideas...'}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}

export default App
