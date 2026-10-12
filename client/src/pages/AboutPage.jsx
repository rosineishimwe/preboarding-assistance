export default function AboutPage() {
  return (
    <div className="container section-space">
      <div className="page-header">
        <p className="eyebrow">About the system</p>
        <h1>Designed around dignity, accessibility, and safe travel.</h1>
      </div>

      <div className="grid two-col">
        <div className="info-card">
          <h2>Purpose</h2>
          <p>
            The Pre-Boarding Assistance System supports passengers with disabilities by coordinating
            travel assistance before departure. It promotes safe, respectful, and predictable journeys
            across Kigali’s transport environment.
          </p>
        </div>
        <div className="info-card">
          <h2>Case study</h2>
          <p>
            This academic prototype uses the National Council of Persons with Disabilities (NCPD), Rwanda,
            as a public-service case study for managing accessibility support requests, staff coordination,
            and reporting.
          </p>
        </div>
      </div>

      <div className="feature-list">
        <div className="feature-item">
          <strong>Accessible by design</strong>
          <span>Large controls, readable contrast, screen-reader-friendly labels, and keyboard-friendly flow.</span>
        </div>
        <div className="feature-item">
          <strong>Transparent coordination</strong>
          <span>Passengers can track request progress while staff and administrators review and assign support.</span>
        </div>
        <div className="feature-item">
          <strong>Respectful support</strong>
          <span>Each request captures personal requirements instead of assuming one fix fits all disabilities.</span>
        </div>
      </div>
    </div>
  );
}
