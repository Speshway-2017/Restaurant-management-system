import React from 'react';
import { ShieldCheck, Lock, FileCheck, Key, EyeOff, Server, CheckCircle2 } from 'lucide-react';

export default function SecurityPage({ setActivePage, onOpenDemoModal }) {
  const rbacMatrix = [
    { role: 'Admin / Owner', access: 'Full System Access: Financials, Pricing, Staff RBAC, Audit Logs, Branch Setup' },
    { role: 'Manager', access: 'Shift Rosters, Discount Approval, Refund Workflows, Escalation Handling' },
    { role: 'Receptionist / Host', access: 'Floor Plan, Seating Assignment, Wait Queue Tokens, Table Bookings' },
    { role: 'Chef / KDS', access: 'Kitchen Order Feed, Item Stock Toggles, Course Status Updates' },
    { role: 'Waiter', access: 'Assigned Table Orders, Handheld Bill Generation, Call Assistance' },
    { role: 'Delivery Staff', access: 'Assigned Delivery Queue, Route Navigation, COD / Payment Settlement' }
  ];

  return (
    <div className="security-page">
      {/* Hero Banner (Unified Page Hero System) */}
      <section className="page-hero-banner-unified">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="page-hero-badge-unified">
            <Lock size={14} />
            <span>ENTERPRISE GOVERNANCE</span>
          </div>

          <h1 className="page-hero-title-unified">
            Bank-Grade Security & Indian Compliance
          </h1>

          <p className="page-hero-subtitle-unified">
            Protecting your restaurant's revenues, staff permissions, guest data, and tax records with Role-Based Access Control (RBAC), DPDP Act alignment, and immutable GST audit logs.
          </p>
        </div>
      </section>

      {/* Security Pillars */}
      <section className="section">
        <div className="grid-3" style={{ marginBottom: '3.5rem' }}>
          <div className="card">
            <ShieldCheck size={32} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
            <h3 className="text-h2" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              DPDP Act (India) Compliant
            </h3>
            <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.9rem' }}>
              Aligned with Digital Personal Data Protection Act requirements. Customer phone numbers and dining histories are encrypted with strict consent controls and guest opt-out tools.
            </p>
          </div>

          <div className="card">
            <FileCheck size={32} style={{ color: 'var(--color-secondary)', marginBottom: '1rem' }} />
            <h3 className="text-h2" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Immutable GST Audit Logs
            </h3>
            <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.9rem' }}>
              Every bill cancellation, price change, and manual discount requires manager clearance and creates an indelible audit trail to prevent staff leakage and ensure smooth CA tax audits.
            </p>
          </div>

          <div className="card">
            <Key size={32} style={{ color: 'var(--color-success)', marginBottom: '1rem' }} />
            <h3 className="text-h2" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              JWT + TLS 1.3 Encryption
            </h3>
            <p className="text-body" style={{ color: 'var(--color-neutral-700)', fontSize: '0.9rem' }}>
              Stateless JWT authentication with short-lived access tokens, refresh token rotation, and bcrypt password hashing for all staff accounts.
            </p>
          </div>
        </div>

        {/* RBAC Matrix Table */}
        <div className="card card-prominent">
          <h2 className="text-h2" style={{ color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
            Role-Based Access Control (RBAC) Governance Matrix
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-neutral-100)', borderBottom: '2px solid var(--color-neutral-200)' }}>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--color-primary)' }}>Role</th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--color-primary)' }}>Scoped Permissions & Modules</th>
                </tr>
              </thead>
              <tbody>
                {rbacMatrix.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-neutral-200)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--color-neutral-900)' }}>
                      {item.role}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-neutral-700)' }}>
                      {item.access}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
