// Blocking theme resolver — runs in <head> before first paint so there is no
// light-then-dark flash.
//
// The authenticated application is one responsive web product. The persisted
// theme therefore follows the user through console, Field and Virtual routes;
// Field is no longer a dark-locked channel. Authentication surfaces retain
// their approved dark first paint independently of the authenticated shell.
// Kept as a raw string (not a bundled module) so it executes synchronously.
//
// Dark is the product default. Sign-in and password reset stay hard-locked to
// dark; every other route resolves an explicit stored choice first and falls
// back to dark only when the user has never chosen. A saved 'light' therefore
// still wins — this changes the default, not the preference.
//
// ThemeChannelSync and ThemeToggle encode the same fallback. All three must
// agree: if this said dark and ThemeChannelSync said light, the first client
// navigation would flip the document back.
const THEME_INIT = `(function(){var f=/^\\/login(\\/|$)|^\\/reset(\\/|$)/.test(location.pathname);var t='dark';if(!f){try{var p=localStorage.getItem('saqeel-theme');if(p==='light'||p==='dark')t=p;}catch(e){}}document.documentElement.setAttribute('data-theme',t);})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
