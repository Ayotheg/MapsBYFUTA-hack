import { Compass, MapPin } from 'lucide-react';
import BrandLogo from './components/BrandLogo';
import FallbackImage from './components/FallbackImage';
import './App.css';

function App() {
  return (
    <main className="setup-shell">
      <section className="setup-card">
        <BrandLogo variant="lockup" tone="light" size={36} />
        <p className="setup-tagline">Your go-to guide on FUTA Campus.</p>

        <div className="setup-preview">
          <FallbackImage
            src="/images/campus-preview.jpg"
            alt="FUTA Campus Preview"
            fallbackLabel="Drop campus-preview.jpg into public/images/ to replace"
            style={{ width: '100%', height: '180px', borderRadius: 'var(--radius-lg)' }}
          />
        </div>

        <div className="setup-meta">
          <span className="setup-pill">
            <MapPin size={16} strokeWidth={2} aria-hidden="true" />
            Tokens &amp; CDN Fonts Ready
          </span>
          <span className="setup-pill setup-pill-teal">
            <Compass size={16} strokeWidth={2} aria-hidden="true" />
            Lucide Icons Active
          </span>
        </div>
      </section>
    </main>
  );
}

export default App;
