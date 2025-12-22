import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import CanvasDraw from 'react-canvas-draw'
import './index.css'

function App() {
  const [activeView, setActiveView] = useState('portafolio') // portafolio, nueva, proteger, prototipar, detalle, editar, producir, vigilancia_mercado

  // App State
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaDescription, setIdeaDescription] = useState('')
  const canvasRef = useRef(null)
  const editCanvasRef = useRef(null)
  const [findings, setFindings] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [generatedIdeas, setGeneratedIdeas] = useState([])
  const [status, setStatus] = useState('idle')
  const [currentFolder, setCurrentFolder] = useState('General')

  // User/Portafolio State
  const [user, setUser] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [selectedIdea, setSelectedIdea] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null) // Lightbox: { url, index }

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;

      const images = selectedIdea?.media?.images || [];
      if (e.key === 'Escape') setSelectedImage(null);
      if (e.key === 'ArrowRight' && selectedImage.index < images.length - 1) {
        const nextIndex = selectedImage.index + 1;
        setSelectedImage({ url: `http://localhost:3000${images[nextIndex]}`, index: nextIndex });
      }
      if (e.key === 'ArrowLeft' && selectedImage.index > 0) {
        const prevIndex = selectedImage.index - 1;
        setSelectedImage({ url: `http://localhost:3000${images[prevIndex]}`, index: prevIndex });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, selectedIdea]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeView])

  // Fetch Initial Data
  useEffect(() => {
    const init = async () => {
      try {
        const uRes = await axios.get('http://localhost:3000/api/user/default')
        setUser(uRes.data)
        const pRes = await axios.get('http://localhost:3000/api/ideas')
        setPortfolio(pRes.data)
      } catch (err) { console.error(err) }
    }
    init()
  }, [])

  const fetchPortfolio = async () => {
    const res = await axios.get('http://localhost:3000/api/ideas')
    setPortfolio(res.data)
  }

  // Handlers
  const handleStartResearch = async () => {
    if (!ideaTitle.trim()) return
    setStatus('researching')
    setFindings([])
    setSelectedIds([])
    try {
      const query = `${ideaTitle} ${ideaDescription}`
      const response = await axios.post('http://localhost:3000/api/start', { query })
      setFindings(response.data.data)
      setActiveView('selection')
    } catch (error) {
      alert('La investigación tardó demasiado o falló. Intenta con un título más corto.')
    } finally {
      setStatus('idle')
    }
  }

  const handleRandomInnovation = async () => {
    setStatus('researching')
    setFindings([])
    setSelectedIds([])
    try {
      const response = await axios.post('http://localhost:3000/api/random-innovation')
      setIdeaTitle(response.data.topic)
      setFindings(response.data.findings)
      setActiveView('selection')
    } catch (error) {
      alert('Error en la innovación aleatoria')
    } finally {
      setStatus('idle')
    }
  }

  const handleGenerate = async () => {
    setStatus('generating')
    try {
      const selectedFindings = findings.filter(f => selectedIds.includes(f.id))
      const response = await axios.post('http://localhost:3000/api/generate-ideas', {
        selectedFindings, context: ideaTitle
      })
      // Map AI response to include original title
      const ideasWithSubtitles = response.data.ideas.map(idea => ({
        ...idea,
        title: ideaTitle, // Keep original
        subtitle: idea.aiName, // AI catchy name
        folder: currentFolder // Assigned folder
      }))
      setGeneratedIdeas(ideasWithSubtitles)
      setStatus('idle')
      setActiveView('resultados')
    } catch (error) { setStatus('idle') }
  }

  const handleSaveIdea = async (idea) => {
    try {
      const sketchData = canvasRef.current ? canvasRef.current.getSaveData() : null;
      await axios.post('http://localhost:3000/api/ideas', {
        ...idea,
        userId: user.id,
        sketch: sketchData,
        findings: findings.filter(f => selectedIds.includes(f.id))
      })
      fetchPortfolio()
      setActiveView('portafolio')
    } catch (err) { alert('Error salvando') }
  }

  const handleUpdateIdea = async () => {
    try {
      const sketchData = editCanvasRef.current ? editCanvasRef.current.getSaveData() : selectedIdea.sketch;
      await axios.put(`http://localhost:3000/api/ideas/${selectedIdea.id}`, {
        ...selectedIdea,
        sketch: sketchData
      })
      alert("Actualizado!")
      openIdeaDetail(selectedIdea.id)
    } catch (err) { alert('Error actualizando') }
  }

  const openIdeaDetail = async (id) => {
    setStatus('loading')
    try {
      const res = await axios.get(`http://localhost:3000/api/ideas/${id}`)
      setSelectedIdea(res.data)
      setActiveView('detalle')
    } catch (err) { console.error(err) } finally { setStatus('idle') }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setStatus('uploading')
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      await axios.post(`http://localhost:3000/api/ideas/${user.id}/${selectedIdea.id}/upload`, formData)
      await openIdeaDetail(selectedIdea.id) // Refrescar media en detalle
      await fetchPortfolio() // Refrescar miniaturas en portafolio
      alert(`${files.length} archivos cargados correctamente!`)
    } catch (err) {
      alert('Error subiendo archivos')
    } finally {
      setStatus('idle')
    }
  }

  const NavItem = ({ id, label, icon }) => (
    <div className={`nav-item ${activeView === id ? 'active' : ''}`} onClick={() => setActiveView(id)}>
      <span>{icon}</span><span>{label}</span>
    </div>
  )

  return (
    <>
      <aside className="sidebar">
        <div className="user-profile">
          <div className="user-name">{user?.name || "Cargando..."}</div>
        </div>
        <nav className="nav-menu">
          <NavItem id="portafolio" label="Portafolio" icon="📁" />
          <NavItem id="nueva" label="Nueva Idea" icon="🚀" />
          <NavItem id="proteger" label="Proteger" icon="✒️" />
          <NavItem id="prototipar" label="Prototipar" icon="🛠️" />
          <hr className="menu-divider" />
          <NavItem id="producir" label="Producir" icon="📦" />
          <NavItem id="vigilancia_mercado" label="Vigilancia de mercado" icon="🔍" />
        </nav>
      </aside>

      <main className="main-layout">
        <header>
          <h1>{activeView.toUpperCase()}</h1>
          <button onClick={handleRandomInnovation} className="small-button">Explorar Tendencias ✨</button>
        </header>

        <div className="content-container">

          {/* VIEW: PORTAFOLIO */}
          {activeView === 'portafolio' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => fetchPortfolio()} className="small-button" style={{ background: '#f1f5f9' }}>📁 Todos</button>
                  {['General', 'Proyectos IA', 'Hardware', 'Software'].map(folder => (
                    <button key={folder} onClick={() => axios.get(`http://localhost:3000/api/ideas?folder=${folder}`).then(res => setPortfolio(res.data))} className="small-button" style={{ background: 'white' }}>
                      {folder}
                    </button>
                  ))}
                </div>
                <button onClick={() => axios.get('http://localhost:3000/api/ideas?trashed=true').then(res => setPortfolio(res.data))} className="small-button" style={{ background: '#fee2e2' }}>🗑️ Papelera</button>
              </div>

              <div className="portfolio-grid">
                {portfolio.map(item => (
                  <div key={item.id} className="idea-card" onClick={() => openIdeaDetail(item.id)} style={{ opacity: item.isTrash ? 0.6 : 1 }}>
                    <div className="idea-thumb">
                      {item.thumb ? (
                        <img src={`http://localhost:3000${item.thumb}`} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : item.videoThumb ? (
                        <video src={`http://localhost:3000${item.videoThumb}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} muted />
                      ) : item.sketch ? (
                        <div style={{ transform: 'scale(0.4)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                          <CanvasDraw disabled saveData={item.sketch} canvasWidth={350} canvasHeight={200} hideGrid hideInterface />
                        </div>
                      ) : (
                        <div style={{ fontSize: '2rem', opacity: 0.3 }}>📁</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'left', padding: '10px' }}>
                      <div className="tag" style={{ fontSize: '0.6rem' }}>{item.status}</div>
                      <h3 style={{ fontSize: '1rem', margin: '5px 0' }}>{item.title}</h3>
                      {item.subtitle && <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '5px' }}>{item.subtitle}</div>}
                      <div className="score-badge" style={{ position: 'static', display: 'inline-block', padding: '2px 8px', fontSize: '0.7rem' }}>{item.score} pts</div>

                      {item.isTrash ? (
                        <button onClick={(e) => { e.stopPropagation(); axios.put(`http://localhost:3000/api/ideas/${item.id}`, { isTrash: false }).then(fetchPortfolio) }} className="small-button" style={{ marginTop: '10px', width: '100%', fontSize: '0.7rem' }}>Restaurar</button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); axios.delete(`http://localhost:3000/api/ideas/${item.id}`).then(fetchPortfolio) }} className="small-button" style={{ marginTop: '10px', width: '100%', fontSize: '0.7rem', color: 'red' }}>Eliminar</button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="idea-card add-btn" onClick={() => setActiveView('nueva')}>
                  <div style={{ fontSize: '3rem' }}>+</div>
                  <div>Nueva</div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DETALLE */}
          {activeView === 'detalle' && selectedIdea && (
            <div className="hand-drawn-card detail-view" style={{ maxWidth: '1000px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <button onClick={() => setActiveView('portafolio')} className="small-button">← Portafolio</button>
                <button onClick={() => setActiveView('editar')} className="small-button" style={{ background: '#dcfce7' }}>Editar ✏️</button>
              </div>

              <header style={{ textAlign: 'left', borderBottom: '2px dashed #ccc', paddingBottom: '1rem' }}>
                <h2 className="card-title-drawn" style={{ fontSize: '2.5rem', margin: 0 }}>{selectedIdea.title}</h2>
                {selectedIdea.subtitle && <h3 style={{ fontSize: '1.2rem', opacity: 0.7, margin: '5px 0' }}>{selectedIdea.subtitle}</h3>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
                  <span className="tag">{selectedIdea.status}</span>
                  <span className="tag" style={{ background: '#fef3c7' }}>Puntaje: {selectedIdea.score}</span>
                </div>
              </header>

              <div className="details-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem', marginTop: '2rem', textAlign: 'left' }}>
                <div className="concept-side">
                  <h4 className="card-title-drawn" style={{ fontSize: '1.5rem' }}>Visión del Proyecto</h4>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{selectedIdea.description}</p>

                  {selectedIdea.sketch && (
                    <div style={{ marginTop: '2rem' }}>
                      <h4 className="card-title-drawn" style={{ fontSize: '1.2rem' }}>Boceto Inicial</h4>
                      <div className="sketch-area preview" style={{ border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
                        <CanvasDraw disabled saveData={selectedIdea.sketch} canvasWidth={500} canvasHeight={300} hideGrid />
                      </div>
                    </div>
                  )}

                  {selectedIdea.analysis && (
                    <div style={{ marginTop: '2rem' }}>
                      <h4 className="card-title-drawn" style={{ fontSize: '1.2rem' }}>Análisis Estratégico</h4>
                      <div className="analysis-box" style={{ background: '#fff9c4', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #facc15' }}>
                        {selectedIdea.analysis}
                      </div>
                    </div>
                  )}
                </div>

                <div className="media-side">
                  <h4 className="card-title-drawn" style={{ fontSize: '1.5rem' }}>Vigilancia y Multimedia</h4>

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                    <label className="small-button" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
                      ➕ Cargar Multimedia (Video/Img)
                      <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,video/*" multiple />
                    </label>

                    <div className="media-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                      {selectedIdea.media?.images.map((img, idx) => (
                        <div key={img} className="media-item" onClick={() => setSelectedImage({ url: `http://localhost:3000${img}`, index: idx })}>
                          <img src={`http://localhost:3000${img}`} alt="User media" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #eee' }} />
                        </div>
                      ))}
                    </div>

                    {selectedIdea.media?.videos.map(vid => (
                      <div key={vid} style={{ marginTop: '15px' }}>
                        <video src={`http://localhost:3000${vid}`} controls style={{ width: '100%', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      </div>
                    ))}
                  </div>

                  <h4 className="card-title-drawn" style={{ fontSize: '1.2rem' }}>Hallazgos Clave</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedIdea.findings?.map(f => (
                      <div key={f.id} className="card" style={{ padding: '12px', fontSize: '0.85rem', background: 'white' }}>
                        <div className="tag" style={{ fontSize: '0.6rem' }}>{f.source}</div>
                        <strong>{f.title}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* VIEW: PROTEGER */}
          {(activeView === 'proteger' || activeView === 'prototipar') && (
            <div className="hand-drawn-card">
              <h2 className="card-title-drawn">{activeView === 'proteger' ? 'Proteger Idea' : 'Prototipar Idea'}</h2>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Selecciona una Idea:</label>
                <select
                  className="input-drawn"
                  value={selectedIdea?.id || ''}
                  onChange={(e) => openIdeaDetail(e.target.value)}
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="">-- Seleccionar proyecto --</option>
                  {portfolio.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {selectedIdea && (
                <div className="protection-container">
                  <div className="hand-drawn-card" style={{ background: '#fff9c4', marginBottom: '2rem', padding: '15px' }}>
                    <h3 style={{ margin: 0 }}>Determinar mejor estrategia</h3>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    {activeView === 'proteger' ? (
                      <>
                        <div className="card hand-drawn-card clickable" onClick={() => setActiveView('redactar_patente')}>
                          <div style={{ fontSize: '2rem' }}>💡</div>
                          <h4>Patente</h4>
                          <p style={{ fontSize: '0.8rem' }}>Redactar patente completa</p>
                        </div>
                        <div className="card hand-drawn-card clickable">
                          <div style={{ fontSize: '2rem' }}>®️</div>
                          <h4>Marca</h4>
                          <p style={{ fontSize: '0.8rem' }}>Identidad comercial</p>
                        </div>
                        <div className="card hand-drawn-card clickable">
                          <div style={{ fontSize: '2rem' }}>🎨</div>
                          <h4>Diseño</h4>
                          <p style={{ fontSize: '0.8rem' }}>Apariencia estética</p>
                        </div>
                        <div className="card hand-drawn-card clickable">
                          <div style={{ fontSize: '2rem' }}>🔒</div>
                          <h4>Secreto</h4>
                          <p style={{ fontSize: '0.8rem' }}>Know-how confidencial</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="card hand-drawn-card clickable">
                          <div style={{ fontSize: '2rem' }}>💻</div>
                          <h4>Software</h4>
                          <p style={{ fontSize: '0.8rem' }}>Código y Algoritmos</p>
                        </div>
                        <div className="card hand-drawn-card clickable">
                          <div style={{ fontSize: '2rem' }}>🏗️</div>
                          <h4>Hardware</h4>
                          <p style={{ fontSize: '0.8rem' }}>Componentes físicos</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="hand-drawn-card" style={{ marginTop: '2rem', textAlign: 'left', padding: '20px', background: 'rgba(255,255,255,0.5)' }}>
                    <h4 className="card-title-drawn">Checklist de Progreso</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" checked readOnly /> Investigando estado del arte
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" /> Elaborando documentación técnica
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" /> Creando figuras y diagramas
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkbox" /> Redactando borrador final
                      </label>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
                      <button className="small-button" style={{ background: '#dcfce7' }}>Lanzar Producto</button>
                      <button className="small-button" style={{ background: '#fef3c7' }}>Licenciar</button>
                      <button className="small-button" style={{ background: '#fee2e2' }}>Vender</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: REDACTAR PATENTE */}
          {activeView === 'redactar_patente' && selectedIdea && (
            <div className="hand-drawn-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={() => setActiveView('proteger')} className="small-button">← Atrás</button>
                <button onClick={handleUpdateIdea} className="small-button" style={{ background: '#dcfce7' }}>Guardar Borrador 💾</button>
              </div>
              <h2 className="card-title-drawn">Borrador de Patente: {selectedIdea.title}</h2>
              <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Este documento sirve como base para la presentación formal ante la oficina de patentes.</p>

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontWeight: 'bold' }}>Título de la Invención</label>
                  <input className="input-drawn" style={{ width: '100%' }} value={selectedIdea.title} readOnly />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold' }}>Descripción Técnica (Resumen)</label>
                  <textarea
                    className="input-drawn"
                    style={{ width: '100%', height: '400px', fontFamily: 'monospace' }}
                    placeholder="Escribe aquí el cuerpo de la patente (Estado del arte, descripción detallada, reivindicaciones...)"
                    value={selectedIdea.patentDraft || ''}
                    onChange={(e) => setSelectedIdea({ ...selectedIdea, patentDraft: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: EDITAR */}
          {activeView === 'editar' && selectedIdea && (
            <div className="hand-drawn-card">
              <h2 className="card-title-drawn">Editar Idea</h2>
              <input className="input-drawn" value={selectedIdea.title} onChange={e => setSelectedIdea({ ...selectedIdea, title: e.target.value })} />
              <textarea className="input-drawn" value={selectedIdea.description} onChange={e => setSelectedIdea({ ...selectedIdea, description: e.target.value })} />
              <div className="sketch-area">
                <CanvasDraw ref={editCanvasRef} saveData={selectedIdea.sketch} canvasWidth={700} canvasHeight={300} />
              </div>
              <button className="btn-primary-drawn" onClick={handleUpdateIdea}>Guardar Cambios</button>
              <button onClick={() => setActiveView('detalle')} className="small-button">Cancelar</button>
            </div>
          )}

          {/* VIEW: NUEVA */}
          {activeView === 'nueva' && (
            <div className="hand-drawn-card">
              <h2 className="card-title-drawn">Crear Proyecto</h2>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input className="input-drawn" style={{ flex: 1 }} placeholder="Título del Proyecto" value={ideaTitle} onChange={e => setIdeaTitle(e.target.value)} />
                <select className="input-drawn" value={currentFolder} onChange={(e) => setCurrentFolder(e.target.value)} style={{ width: '200px' }}>
                  {['General', 'Proyectos IA', 'Hardware', 'Software'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="sketch-area">
                <CanvasDraw ref={canvasRef} canvasWidth={700} canvasHeight={300} />
              </div>
              <textarea className="input-drawn" placeholder="Descripción" value={ideaDescription} onChange={e => setIdeaDescription(e.target.value)} />
              <button className="btn-primary-drawn" onClick={handleStartResearch}>Investigar Mercado</button>
            </div>
          )}

          {/* VIEW: SELECTION */}
          {activeView === 'selection' && (
            <div>
              <h2 className="card-title-drawn">Hallazgos Clave</h2>
              <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>Selecciona los hallazgos que servirán de referencia para tus ideas:</p>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {findings.map(f => (
                  <div
                    key={f.id}
                    className={`hand-drawn-card clickable ${selectedIds.includes(f.id) ? 'selected' : ''}`}
                    onClick={() => setSelectedIds(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])}
                    style={{
                      padding: '20px',
                      textAlign: 'left',
                      border: selectedIds.includes(f.id) ? '2px solid #2563eb' : '1px solid #ddd',
                      background: selectedIds.includes(f.id) ? '#eff6ff' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span className="tag" style={{ fontSize: '0.6rem', margin: 0 }}>{f.source}</span>
                      {f.url && f.url !== '#' && <a href={f.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.8rem', color: '#2563eb' }}>🔗 Ver fuente</a>}
                    </div>
                    <strong>{f.title}</strong>
                    <p style={{ fontSize: '0.85rem', marginTop: '10px', opacity: 0.8, lineHeight: '1.4' }}>{f.snippet}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem', position: 'sticky', bottom: '20px', textAlign: 'center' }}>
                <button className="btn-primary-drawn" onClick={handleGenerate} style={{ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  Generar Ideas basas en Selección ({selectedIds.length})
                </button>
              </div>
            </div>
          )}

          {/* VIEW: RESULTADOS */}
          {activeView === 'resultados' && (
            <div className="grid">
              {generatedIdeas.map((idea, idx) => (
                <div key={idx} className="idea-card" style={{ height: 'auto' }}>
                  <h3>{idea.title}</h3>
                  <p>{idea.description}</p>
                  <button className="primary-button" onClick={() => handleSaveIdea(idea)}>Guardar en Portafolio</button>
                </div>
              ))}
            </div>
          )}

          {/* VIEW: PRODUCIR */}
          {activeView === 'producir' && (
            <div className="hand-drawn-card">
              <h2 className="card-title-drawn">Producir y Escalar</h2>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Selecciona una Idea:</label>
                <select className="input-drawn" value={selectedIdea?.id || ''} onChange={(e) => openIdeaDetail(e.target.value)} style={{ width: '100%', padding: '10px' }}>
                  <option value="">-- Seleccionar proyecto --</option>
                  {portfolio.map(p => (<option key={p.id} value={p.id}>{p.title}</option>))}
                </select>
              </div>
              {selectedIdea && (
                <div className="grid">
                  <div className="card hand-drawn-card">
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
                    <h4>Inventario</h4>
                    <p style={{ fontSize: '0.8rem' }}>Proveedores y Stock</p>
                  </div>
                  <div className="card hand-drawn-card">
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏭</div>
                    <h4>Fábrica</h4>
                    <p style={{ fontSize: '0.8rem' }}>Gestión de Producción</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: VIGILANCIA */}
          {activeView === 'vigilancia_mercado' && (
            <div className="hand-drawn-card">
              <h2 className="card-title-drawn">Vigilancia de Mercado</h2>
              <div style={{ marginBottom: '2rem', display: 'flex', gap: '10px' }}>
                <input className="input-drawn" style={{ flex: 1 }} placeholder="Tecnología o Competidor a vigilar..." />
                <button className="small-button">Crear Alerta 🔔</button>
              </div>
              <div className="grid">
                <div className="card hand-drawn-card">
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
                  <h4>Patentes Recientes</h4>
                  <p style={{ fontSize: '0.8rem' }}>Nuevos registros sectoriales</p>
                </div>
                <div className="card hand-drawn-card">
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📊</div>
                  <h4>Tendencias</h4>
                  <p style={{ fontSize: '0.8rem' }}>Cambios de consumo</p>
                </div>
              </div>
            </div>
          )}

          {status !== 'idle' && (
            <div className="status-overlay">
              <div className="loader"></div>
              <p style={{ marginTop: '1rem', color: 'white' }}>{status.toUpperCase()}...</p>
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, transition: 'all 0.3s'
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ position: 'relative', textAlign: 'center' }}>
            <img src={selectedImage.url} alt="Full view" style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: '5px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} />

            {/* Navigation Info */}
            <div style={{ color: 'white', marginTop: '15px', fontSize: '0.9rem' }}>
              Imagen {selectedImage.index + 1} de {selectedIdea?.media?.images?.length}
              <br />
              <span style={{ opacity: 0.6 }}>Usa las flechas ← → para navegar o Esc para cerrar</span>
            </div>

            <button onClick={() => setSelectedImage(null)} style={{
              position: 'absolute', top: '-40px', right: 0, background: 'none',
              border: 'none', color: 'white', fontSize: '40px', cursor: 'pointer', fontWeight: 'lighter'
            }}>×</button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
