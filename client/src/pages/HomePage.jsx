import { ArrowRight, ClipboardList, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const highlights = [
  { icon: ClipboardList, title: 'Request support', text: 'Submit a detailed pre-boarding request with your preferred travel timing and support needs.' },
  { icon: Users, title: 'Qualified coordination', text: 'Authorized staff review and assign support to the right team before departure.' },
  { icon: ShieldCheck, title: 'Secure handling', text: 'Sensitive assistance information stays protected and visible only to authorized personnel.' },
];

export default function HomePage() {
  return (
    <div>
      <section className="hero-section">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Pre-Boarding Assistance System</p>
            <h1>Helping passengers with disabilities travel with confidence and dignity.</h1>
            <p className="hero-copy">
              The system supports passengers before departure by organizing relevant assistance, staff review,
              and status updates in a clear and accessible way.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" to="/register">
                Request assistance
                <ArrowRight size={18} />
              </Link>
              <Link className="btn btn-secondary" to="/services">
                Explore services
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="mini-card card-top">
              <span>Travel assistance</span>
              <strong>48 requests tracked</strong>
            </div>
            <div className="mini-card card-mid">
              <span>Average review time</span>
              <strong>2-4 hours</strong>
            </div>
            <div className="mini-card card-bottom">
              <span>Support categories</span>
              <strong>6 assistance types</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="container section-space">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Accessible support from request to completion</h2>
        </div>

        <div className="card-grid three-col">
          {highlights.map(({ icon: Icon, title, text }) => (
            <article key={title} className="info-card">
              <div className="service-icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
