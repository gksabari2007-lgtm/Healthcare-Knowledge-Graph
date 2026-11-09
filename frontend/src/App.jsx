import { useEffect, useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react'
import { Activity, Network, Users, Pill, Search, Plus, Database, HeartPulse, Stethoscope, Trash2 } from 'lucide-react'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db, firebaseConfigured } from './firebase'
import { starterEntities, starterRelationships } from './data'

const types = ['Patient', 'Disease', 'Symptom', 'Medicine', 'Treatment']
const colors = { Patient: '#2563eb', Disease: '#dc4444', Symptom: '#d99a19', Medicine: '#15966b', Treatment: '#805ad5' }

export default function App() {
  const [entities, setEntities] = useState(starterEntities)
  const [relationships, setRelationships] = useState(starterRelationships)
  const [page, setPage] = useState('Overview')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState(firebaseConfigured ? 'Connecting to Firebase…' : 'Demo mode: add Firebase configuration to save data online.')
  const [form, setForm] = useState({ name: '', type: 'Disease', description: '' })
  const [rel, setRel] = useState({ sourceId: starterEntities[0]?.id || '', targetId: starterEntities[1]?.id || '', label: 'RELATED_TO' })

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (!firebaseConfigured || !db) return
    ;(async () => {
      try {
        const [e, r] = await Promise.all([getDocs(collection(db, 'entities')), getDocs(collection(db, 'relationships'))])
        if (!e.empty) setEntities(e.docs.map(d => ({ id: d.id, ...d.data() })))
        if (!r.empty) setRelationships(r.docs.map(d => ({ id: d.id, ...d.data() })))
        setNotice('Connected to Firebase Firestore.')
      } catch (err) {
        setNotice(`Firebase connection failed: ${err.message}. Check your Firebase configuration and Firestore rules.`)
      }
    })()
  }, [])

  // Keep relationship select dropdown values valid when entities change
  useEffect(() => {
    if (entities.length > 0) {
      setRel(prev => {
        const validSource = entities.some(e => e.id === prev.sourceId) ? prev.sourceId : entities[0].id
        const remainingForTarget = entities.filter(e => e.id !== validSource)
        const validTarget = entities.some(e => e.id === prev.targetId && e.id !== validSource)
          ? prev.targetId
          : (remainingForTarget[0]?.id || entities[0].id)
        return { ...prev, sourceId: validSource, targetId: validTarget }
      })
    }
  }, [entities])

  // Synchronize ReactFlow nodes with entities while preserving user-dragged positions
  useEffect(() => {
    const count = Math.max(entities.length, 1)
    setNodes(prevNodes => {
      const prevPosMap = new Map(prevNodes.map(n => [n.id, n.position]))
      return entities.map((e, i) => ({
        id: e.id,
        position: prevPosMap.get(e.id) || {
          x: 320 + 260 * Math.cos((2 * Math.PI * i) / count),
          y: 220 + 170 * Math.sin((2 * Math.PI * i) / count)
        },
        data: {
          label: (
            <div className="graph-node">
              <b>{e.name}</b>
              <small>{e.type}</small>
            </div>
          )
        },
        style: {
          border: `2px solid ${colors[e.type] || '#64748b'}`,
          borderRadius: 14,
          padding: 8,
          background: '#111d30',
          color: '#f8fafc',
          minWidth: 135
        }
      }))
    })
  }, [entities, setNodes])

  // Synchronize ReactFlow edges with relationships
  useEffect(() => {
    const entityIds = new Set(entities.map(e => e.id))
    const validEdges = relationships
      .filter(r => entityIds.has(r.sourceId) && entityIds.has(r.targetId))
      .map(r => ({
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        label: r.label,
        animated: true,
        style: { stroke: '#8ba5c7' },
        labelStyle: { fill: '#cbd5e1', fontSize: 10 }
      }))
    setEdges(validEdges)
  }, [relationships, entities, setEdges])

  const filtered = entities.filter(x => `${x.name} ${x.type} ${x.description || ''}`.toLowerCase().includes(search.toLowerCase()))

  const saveEntity = async (ev) => {
    ev.preventDefault()
    if (!form.name.trim()) return
    const item = { ...form, name: form.name.trim(), createdAt: new Date().toISOString() }
    try {
      if (firebaseConfigured && db) {
        const result = await addDoc(collection(db, 'entities'), item)
        item.id = result.id
      } else {
        item.id = `local_${Date.now()}`
      }
      setEntities(prev => [...prev, item])
      setForm({ name: '', type: 'Disease', description: '' })
      setNotice(firebaseConfigured ? 'Record saved to Firestore.' : 'Record added in this demo session. Configure Firebase to save permanently.')
    } catch (err) {
      setNotice(`Could not save: ${err.message}`)
    }
  }

  const removeEntity = async (id) => {
    try {
      if (firebaseConfigured && db && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'entities', id))
      }
      setEntities(prev => prev.filter(x => x.id !== id))
      const toRemove = relationships.filter(r => r.sourceId === id || r.targetId === id)
      for (const r of toRemove) {
        if (firebaseConfigured && db && !r.id.startsWith('local_')) {
          await deleteDoc(doc(db, 'relationships', r.id)).catch(() => {})
        }
      }
      setRelationships(prev => prev.filter(r => r.sourceId !== id && r.targetId !== id))
      setNotice('Entity and linked relationships deleted.')
    } catch (err) {
      setNotice(`Could not delete entity: ${err.message}`)
    }
  }

  const saveRelationship = async (ev) => {
    ev.preventDefault()
    if (rel.sourceId === rel.targetId) return setNotice('Choose two different entities.')
    const item = { ...rel, createdAt: new Date().toISOString() }
    try {
      if (firebaseConfigured && db) {
        const result = await addDoc(collection(db, 'relationships'), item)
        item.id = result.id
      } else {
        item.id = `local_rel_${Date.now()}`
      }
      setRelationships(prev => [...prev, item])
      setNotice('Relationship added.')
    } catch (err) {
      setNotice(`Could not add relationship: ${err.message}`)
    }
  }

  const removeRelationship = async (id) => {
    try {
      if (firebaseConfigured && db && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'relationships', id))
      }
      setRelationships(prev => prev.filter(x => x.id !== id))
      setNotice('Relationship deleted.')
    } catch (err) {
      setNotice(`Could not delete: ${err.message}`)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><HeartPulse /></div>
          <div><b>HealthGraph</b><small>KNOWLEDGE PLATFORM</small></div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        {['Overview', 'Entities', 'Relationships', 'Knowledge Graph'].map((p, i) => (
          <button
            key={p}
            className={`nav-item ${page === p ? 'active' : ''}`}
            onClick={() => setPage(p)}
          >
            {[<Activity key="1" />, <Database key="2" />, <Network key="3" />, <Stethoscope key="4" />][i]}
            {p}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="status-dot" />
          {firebaseConfigured ? 'Firebase configured' : 'Local demo mode'}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">HEALTHCARE DATA PLATFORM</span>
            <h1>{page}</h1>
          </div>
          <div className="top-right">
            <span className="avatar">HG</span>
          </div>
        </header>

        <div className="notice">
          <span className="status-dot" />
          {notice}
        </div>

        {page === 'Overview' && (
          <>
            <section className="stats">
              <Stat icon={<Users />} label="Total entities" value={entities.length} />
              <Stat icon={<HeartPulse />} label="Diseases" value={entities.filter(e => e.type === 'Disease').length} />
              <Stat icon={<Pill />} label="Medicines" value={entities.filter(e => e.type === 'Medicine').length} />
              <Stat icon={<Network />} label="Relationships" value={relationships.length} />
            </section>
            <section className="panel welcome">
              <div>
                <span className="eyebrow">YOUR KNOWLEDGE SPACE</span>
                <h2>Connect healthcare information.</h2>
                <p>Organize entities and explore how they relate through an interactive knowledge graph.</p>
                <button className="primary" onClick={() => setPage('Knowledge Graph')}>
                  Explore knowledge graph <Network size={16} />
                </button>
              </div>
              <div className="welcome-art">
                <Network size={100} />
                <span>● ─── ●</span>
                <span> ╲  │  ╱ </span>
                <span>● ─── ●</span>
              </div>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Recent entities</h3>
                  <p>Your healthcare knowledge records</p>
                </div>
                <button className="secondary" onClick={() => setPage('Entities')}>View all</button>
              </div>
              <EntityTable items={entities.slice(-5).reverse()} />
            </section>
          </>
        )}

        {page === 'Entities' && (
          <div className="content-grid">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Add an entity</h3>
                  <p>Create a patient, disease, symptom, medicine or treatment record.</p>
                </div>
              </div>
              <form onSubmit={saveEntity} className="form">
                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Asthma"
                    required
                  />
                </label>
                <label>
                  Entity type
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {types.map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  Description
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Short educational description"
                    rows="4"
                  />
                </label>
                <button className="primary"><Plus size={16} /> Save entity</button>
              </form>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Entity library</h3>
                  <p>{filtered.length} records</p>
                </div>
              </div>
              <div className="search">
                <Search size={17} />
                <input
                  placeholder="Search entities…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <EntityTable items={filtered} onDelete={removeEntity} />
            </section>
          </div>
        )}

        {page === 'Relationships' && (
          <div className="content-grid">
            <section className="panel">
              <h3>Create a relationship</h3>
              <p>Connect two existing entities with a meaningful label.</p>
              <form className="form" onSubmit={saveRelationship}>
                <label>
                  From
                  <select value={rel.sourceId} onChange={e => setRel({ ...rel, sourceId: e.target.value })}>
                    {entities.map(e => <option key={e.id} value={e.id}>{e.name} ({e.type})</option>)}
                  </select>
                </label>
                <label>
                  Relationship label
                  <input
                    value={rel.label}
                    onChange={e => setRel({ ...rel, label: e.target.value.toUpperCase().replaceAll(' ', '_') })}
                    placeholder="e.g. TREATS, DIAGNOSED_WITH"
                    required
                  />
                </label>
                <label>
                  To
                  <select value={rel.targetId} onChange={e => setRel({ ...rel, targetId: e.target.value })}>
                    {entities.map(e => <option key={e.id} value={e.id}>{e.name} ({e.type})</option>)}
                  </select>
                </label>
                <button className="primary" disabled={entities.length < 2}>
                  <Plus size={16} /> Add relationship
                </button>
              </form>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>Relationships</h3>
                  <p>Links between knowledge records ({relationships.length})</p>
                </div>
              </div>
              {relationships.length === 0 ? (
                <p style={{ color: '#8297b0', fontSize: '12px' }}>No relationships added yet.</p>
              ) : (
                relationships.map(r => (
                  <div className="relationship-row" key={r.id}>
                    <div>
                      <b>{entities.find(e => e.id === r.sourceId)?.name || r.sourceId}</b>
                      <small>{r.label}</small>
                      <b>{entities.find(e => e.id === r.targetId)?.name || r.targetId}</b>
                    </div>
                    <button className="icon-button" title="Delete relationship" onClick={() => removeRelationship(r.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {page === 'Knowledge Graph' && (
          <section className="panel graph-panel">
            <div className="panel-head">
              <div>
                <h3>Interactive relationship map</h3>
                <p>Drag nodes, zoom, and explore connected records.</p>
              </div>
              <span className="legend">
                {types.map(t => <span key={t}><i style={{ background: colors[t] }} />{t}</span>)}
              </span>
            </div>
            <div className="graph-wrap">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{ padding: 0.25 }}
              >
                <Background color="#26364b" gap={22} />
                <MiniMap nodeColor={n => colors[entities.find(e => e.id === n.id)?.type] || '#64748b'} />
                <Controls />
              </ReactFlow>
            </div>
          </section>
        )}

        <footer>Educational prototype · Fictional demo data only · Not for medical diagnosis</footer>
      </main>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div><strong>{value}</strong><span>{label}</span></div>
    </div>
  )
}

function EntityTable({ items, onDelete }) {
  if (!items || items.length === 0) {
    return <p style={{ color: '#8297b0', fontSize: '12px', padding: '12px 0' }}>No entities found.</p>
  }
  return (
    <div className="entity-list">
      {items.map(e => (
        <div className="entity-row" key={e.id}>
          <span className="entity-mark" style={{ background: colors[e.type] || '#64748b' }} />
          <div className="entity-info">
            <b>{e.name}</b>
            <small>{e.description || 'No description added'}</small>
          </div>
          <span className="type-pill">{e.type}</span>
          {onDelete && (
            <button
              className="icon-button"
              title="Delete entity"
              onClick={() => onDelete(e.id)}
              style={{ marginLeft: 8, padding: 6 }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
