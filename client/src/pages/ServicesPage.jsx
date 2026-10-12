import { Accessibility, BellRing, ClipboardCheck, HandHelping, ShieldCheck } from 'lucide-react';

const serviceCards = [
  { icon: HandHelping, title: 'Mobility support', text: 'Wheelchair assistance and guided boarding support for passengers who need physical help.' },
  { icon: Accessibility, title: 'Visual guidance', text: 'Route guidance, platform support, and clear directional assistance for passengers with low vision.' },
  { icon: BellRing, title: 'Communication assistance', text: 'Support for hearing or communication access throughout the boarding process.' },
  { icon: ClipboardCheck, title: 'Request tracking', text: 'Live updates, staff assignment, and clear status management from submission to completion.' },
  { icon: ShieldCheck, title: 'Protected handling', text: 'Personal accessibility information is restricted to authorized staff and administrators.' },
];

export default function ServicesPage() {
  return (
    <div className="container section-space">
      <div className="page-header">
        <p className="eyebrow">Services</p>
        <h1>Support options made around the individual journey.</h1>
      </div>

      <div className="services-grid">
        {serviceCards.map(({ icon: Icon, title, text }) => (
          <article key={title} className="info-card service-card">
            <div className="service-icon"><Icon size={24} /></div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
