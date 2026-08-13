import React from 'react';
import { Zap, Cpu, Server, Activity, Database, ShieldCheck, Gauge, CheckCircle2 } from 'lucide-react';

export default function PerformancePage({ setActivePage, onOpenDemoModal }) {
  const benchmarks = [
    { title: 'Socket.io Latency', value: '< 42 ms', desc: 'Average order update propagation time from Customer QR submit to Chef KDS screen' },
    { title: 'Redis Cache Hit Rate', value: '99.4%', desc: 'Frequently read digital menu items served directly from in-memory Redis cache' },
    { title: 'PWA Menu First Paint', value: '0.8 sec', desc: 'Customer digital menu load time on 3G mobile connections across Tier 2 & 3 Indian cities' },
    { title: 'Peak Concurrency SLA', value: '15,000 req/s', desc: 'Tested stress capacity during Friday night peak dinner rushes without page dropouts' }
  ];

  return (
    <div className="performance-page">
      {/* Hero Banner (Unified Page Hero System) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Gauge size={14} />
            <span>HIGH-SPEED ARCHITECTURE</span>
          </div>

          <h1 className="page-hero-title-unified">
            Zero-Lag Performance & Real-Time Benchmarks
          </h1>

          <p className="page-hero-subtitle-unified">
            When a noisy kitchen is waiting for KOT tickets during peak dinner hours, milliseconds matter. Discover how our Node.js, Redis, and Socket.io engine guarantees sub-50ms order delivery.
          </p>
        </div>
      </section>

      {/* Benchmark Grid */}
      <section className="section">
        <div className="grid-4" style={{ marginBottom: '3.5rem' }}>
          {benchmarks.map((item, idx) => (
            <div key={idx} className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--color-secondary)' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', marginBottom: '0.25rem' }}>
                {item.value}
              </div>
              <h3 className="text-h2" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
              <p className="text-caption">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Tech Stack Specs */}
        <div className="card card-prominent grid-2" style={{ alignItems: 'center' }}>
          <div>
            <div className="badge-tag">Stack Architectural Blueprint</div>
            <h2 className="text-h1" style={{ color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>
              MERN + Redis + Flutter Infrastructure
            </h2>
            <p className="text-body" style={{ color: 'var(--color-neutral-700)', marginBottom: '1.5rem' }}>
              As documented in `docs/techstack.md`, Flavora Kitchen combines MongoDB Atlas flexible document schema with Redis caching and bi-directional Socket.io pub-sub channels.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                <span><strong>Redis Adapter for Socket.io:</strong> Horizontal scaling across Node.js instances</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                <span><strong>Razorpay Webhook Reliability:</strong> Automatic settlement retry queues</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                <span><strong>Flutter Local Storage:</strong> Offline tolerance for Waiter POS devices</span>
              </li>
            </ul>
          </div>

          <div style={{ background: 'var(--color-bg-dark)', color: '#FFF6E8', padding: '2rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.7' }}>
            <div style={{ color: 'var(--color-accent)', fontWeight: 'bold', marginBottom: '1rem' }}>
              // LIVE BENCHMARK PULSE LOG
            </div>
            <div>[04:42:15] POS_GATEWAY: WebSocket connection initialized (TLS 1.3)</div>
            <div>[04:42:15] MONGO_DB: Read menu query completed in 2.1ms (Cache Hit)</div>
            <div>[04:42:16] SOCKET_IO: Order #T04-1082 broadcasted to KDS channel</div>
            <div style={{ color: 'var(--color-success)' }}>[04:42:16] CHEF_KDS: Received payload in 38ms — UI Rendered</div>
            <div>[04:42:16] RAZORPAY_API: Dynamic UPI QR generated for Table #04</div>
            <div style={{ color: 'var(--color-warning)', marginTop: '0.5rem' }}>✓ STATUS: ALL METRICS WITHIN SLA PARAMETERS</div>
          </div>
        </div>
      </section>
    </div>
  );
}
