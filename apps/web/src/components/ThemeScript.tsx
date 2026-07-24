// Blocking theme resolver — runs in <head> before first paint so there is no
// light-then-dark flash.
//
// Channel-dependent default: the web console keeps the sponsor-approved
// government light theme, while the field channel (the iPad inspector app and
// its sign-in surface) resolves to dark. The field app is used outdoors and at
// night, and its design source paints the darkest surface in the ramp.
//
// This changes only the DEFAULT. An explicit choice persisted under
// `saqeel-theme` still wins on every route, in both directions, so an inspector
// who selects light keeps light and a console user who selects dark keeps dark.
// Kept as a raw string (not a bundled module) so it executes synchronously.
const THEME_INIT = `(function(){var f=/^\\/field(\\/|$)|^\\/login\\/field(\\/|$)/.test(location.pathname);var t=f?'dark':'light';try{var p=localStorage.getItem('saqeel-theme');if(p==='light'||p==='dark')t=p;}catch(e){}document.documentElement.setAttribute('data-theme',t);})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
