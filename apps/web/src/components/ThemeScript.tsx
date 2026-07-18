// Blocking theme resolver — runs in <head> before first paint so there is no
// light-then-dark flash. Reads the persisted choice; first install resolves to
// the sponsor-approved government light theme.
// Kept as a raw string (not a bundled module) so it executes synchronously.
const THEME_INIT = `(function(){var t='light';try{var p=localStorage.getItem('saqeel-theme');if(p==='light'||p==='dark')t=p;}catch(e){}document.documentElement.setAttribute('data-theme',t);})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
