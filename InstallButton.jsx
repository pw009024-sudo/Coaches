import { useEffect, useState } from 'react';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Zeigt „App installieren“ (Android, Chrome, Edge) oder eine kurze Anleitung (iPhone/iPad).
export default function InstallButton() {
  const [prompt, setPrompt] = useState(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  if (prompt) {
    return (
      <button
        className="install-btn"
        onClick={async () => {
          prompt.prompt();
          await prompt.userChoice;
          setPrompt(null);
        }}
      >
        App installieren
      </button>
    );
  }

  if (isIOS()) {
    return (
      <>
        <button className="install-btn" onClick={() => setShowIosHelp(true)}>App installieren</button>
        {showIosHelp && (
          <div className="ios-help" role="dialog" aria-label="App auf dem iPhone installieren">
            <p>
              Tippe unten in Safari auf <strong>Teilen</strong> (Quadrat mit Pfeil nach oben), scrolle etwas nach unten und
              wähle <strong>„Zum Home-Bildschirm“</strong>.
            </p>
            <button className="link-btn" onClick={() => setShowIosHelp(false)}>Verstanden</button>
          </div>
        )}
      </>
    );
  }

  return null;
}
