import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { lessons } from './lessons';
import { Home } from './pages/Home';

// Each lesson loads on demand, so the first page opens fast.
const pages: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  thesis: lazy(() => import('./pages/Thesis')),
  cva: lazy(() => import('./pages/Cva')),
  'sa-ccr': lazy(() => import('./pages/SaCcr')),
  'ba-cva': lazy(() => import('./pages/BaCva')),
  'sa-cva': lazy(() => import('./pages/SaCva')),
  exemptions: lazy(() => import('./pages/Exemptions')),
  hedging: lazy(() => import('./pages/Hedging')),
  results: lazy(() => import('./pages/Results')),
};
const Glossary = lazy(() => import('./pages/Glossary'));

function ScrollToTop() {
  const { pathname } = useLocation();
  // Braces matter: newer browsers return a value from scrollTo, and React would
  // treat a returned value as a clean-up function and crash on the next page change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    // HashRouter (#/curves) works on GitHub Pages without any server config.
    <HashRouter>
      <ScrollToTop />
      <div className="app">
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <div className="brand">
            <NavLink to="/" onClick={() => setMenuOpen(false)}>
              <span className="brand-mark" aria-hidden>
                ⛨
              </span>
              CVA Capital Lab
            </NavLink>
            <button className="menu-button" type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
              ☰
            </button>
          </div>
          <nav className="nav">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>
              Overview
            </NavLink>
            {lessons.map((l) => (
              <NavLink key={l.id} to={l.path} onClick={() => setMenuOpen(false)}>
                <span className="nav-num">{l.number}</span>
                {l.title}
              </NavLink>
            ))}
            <NavLink to="/glossary" className="nav-extra" onClick={() => setMenuOpen(false)}>
              <span className="nav-num">A–Z</span>
              Glossary
            </NavLink>
          </nav>
          <div className="sidebar-foot">Numbers come from the thesis's frozen run (v0.8). Stylised portfolio, not real bank data.</div>
        </aside>
        <main className="content">
          <Suspense fallback={<div className="loading">Loading lesson…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/glossary" element={<Glossary />} />
              {lessons.map((l) => {
                const Page = pages[l.id];
                return <Route key={l.id} path={l.path} element={<Page />} />;
              })}
            </Routes>
          </Suspense>
        </main>
      </div>
    </HashRouter>
  );
}
