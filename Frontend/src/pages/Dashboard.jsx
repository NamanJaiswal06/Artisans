import { useState, useEffect } from 'react'
import { healthCheck, recentIncidents, listCases } from '../services/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import CountUp from 'react-countup'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const [stats, setStats] = useState({ incidents: 0, cases: 0, risk: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [incRes, casesRes] = await Promise.all([
          recentIncidents(10),
          listCases()
        ])
        const incidents = incRes.data || []
        const cases = casesRes.data || []
        setStats({
          incidents: incidents.length * 12, // Dummy multiplier for demo
          cases: cases.length,
          risk: 42 // Demo risk score
        })
        setRecent(incidents.slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const riskData = [
    { name: 'Phishing', value: 400 },
    { name: 'BEC', value: 300 },
    { name: 'Wire Fraud', value: 300 },
    { name: 'ATO', value: 200 },
  ];
  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b'];

  const trendData = [
    { name: 'Mon', events: 40 },
    { name: 'Tue', events: 30 },
    { name: 'Wed', events: 20 },
    { name: 'Thu', events: 27 },
    { name: 'Fri', events: 18 },
    { name: 'Sat', events: 23 },
    { name: 'Sun', events: 34 },
  ];

  if (loading) return <div className="loading-spinner" style={{ margin: 'auto' }} />

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 24 }}>System Overview</h2>
      
      <div className="stats-grid">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>🚨</div>
          <div className="stat-label">Total Incidents</div>
          <div className="stat-value"><CountUp end={stats.incidents} duration={2} /></div>
          <div className="stat-change positive">↑ 12% from last week</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>📁</div>
          <div className="stat-label">Open Cases</div>
          <div className="stat-value"><CountUp end={stats.cases} duration={2} /></div>
          <div className="stat-change negative">↓ 5% from last week</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>⚖️</div>
          <div className="stat-label">Avg Enterprise Risk</div>
          <div className="stat-value"><CountUp end={stats.risk} duration={2} />/100</div>
          <div className="stat-change negative">Critical Threshold</div>
        </motion.div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Threat Distribution</h3>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Weekly Threat Trend</h3>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                <Line type="monotone" dataKey="events" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
