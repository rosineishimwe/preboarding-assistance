import { useEffect, useState } from 'react';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const copy = {
  en: {
    title: 'Help and contact',
    summary: 'Need assistance or want to confirm your request details? Use the official contact information configured by the organization.',
    guidance: 'Request submission and status updates are tracked in the secure system. Official confirmation is only made after the organization verifies the request and assigns a staff member.',
    configuredTitle: 'Verified contact details',
    notConfiguredTitle: 'Contact details pending verification',
    email: 'Email',
    phone: 'Phone',
    emailInfo: 'Email support is available only when an administrator has configured and verified a valid address.',
    phoneInfo: 'Phone support is available only when an administrator has configured and verified a valid number.',
    noContact: 'No verified contact details are configured yet. Please ask the organization to add and validate them in the administrator dashboard.',
    loading: 'Loading contact information...',
  },
  rw: {
    title: 'Ubufasha no guhuza',
    summary: 'Ukeneye ubufasha cyangwa ushaka kwemeza amakuru ya gahunda yawe? Koresha amakuru yemewe y’igikorwa yashyizweho n’umuyobozi.',
    guidance: 'Saba ubufasha no gukurikirana status byandikwa muri sisitemu yizewe. Kwemezwa ku buryo bwemewe biba nyuma yuko umuryango wemeza icyifuzo kandi akabugenera umukozi.',
    configuredTitle: 'Amakuru yemewe yo guhuza',
    notConfiguredTitle: 'Amakuru yo guhuza aracyategerezwa kwemezwa',
    email: 'Imeri',
    phone: 'Terefone',
    emailInfo: 'Ubufasha bwo kohereza imeri buba bwarashyizweho n’umuyobozi kandi bukeza kwemezwa.',
    phoneInfo: 'Ubufasha bwo guhamagara buba bwarashyizweho n’umuyobozi kandi bukeza kwemezwa.',
    noContact: 'Nta makuru yemewe yo guhuza yashyizwemo. Musabe ko umuyobozi akayashyiraho akayemeza muri dashboard.',
    loading: 'Iramura amakuru yo guhuza...',
  },
};

export default function ContactPage() {
  const { language } = useLanguage();
  const text = copy[language] || copy.en;
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const data = await api('/public/contact');
        setSettings(data);
      } catch (err) {
        setError(err.message || 'Unable to load contact information.');
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, []);

  return (
    <div className="container section-space">
      <section className="panel info-panel">
        <p className="eyebrow">NCPD</p>
        <h1>{text.title}</h1>
        <p>{text.summary}</p>
        <div className="alert alert-info" role="status">
          <ShieldCheck size={18} />
          <span>{text.guidance}</span>
        </div>

        {loading && <p className="empty-state">{text.loading}</p>}
        {error && <p className="alert alert-error">{error}</p>}

        {!loading && !error && settings && (
          <div className="contact-list">
            <div className="contact-card">
              <h2>{settings.organization_name || 'Pre-Boarding Assistance'}</h2>
              {settings.contact_email ? (
                <a href={`mailto:${settings.contact_email}`} className="contact-item">
                  <Mail size={18} />
                  <span>
                    <strong>{text.email}</strong>
                    <span>{settings.contact_email}</span>
                  </span>
                </a>
              ) : (
                <div className="contact-item muted-item">
                  <Mail size={18} />
                  <span>
                    <strong>{text.email}</strong>
                    <span>{text.emailInfo}</span>
                  </span>
                </div>
              )}

              {settings.contact_phone ? (
                <a href={`tel:${settings.contact_phone}`} className="contact-item">
                  <Phone size={18} />
                  <span>
                    <strong>{text.phone}</strong>
                    <span>{settings.contact_phone}</span>
                  </span>
                </a>
              ) : (
                <div className="contact-item muted-item">
                  <Phone size={18} />
                  <span>
                    <strong>{text.phone}</strong>
                    <span>{text.phoneInfo}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="status-box">
              <h3>{settings.contact_email || settings.contact_phone ? text.configuredTitle : text.notConfiguredTitle}</h3>
              <p>{settings.support_message || text.noContact}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
