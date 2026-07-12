// Blocking theme resolver — runs in <head> before first paint so there is no
// light-then-dark flash. Reads the persisted choice; if none, leaves the
// attribute off so tokens.css falls through to the OS prefers-color-scheme.
// Kept as a raw string (not a bundled module) so it executes synchronously.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('saqeel-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
