// Blocking theme resolver — runs in <head> before first paint so there is no
// light-then-dark flash.
//
// The authenticated application is one responsive web product. The persisted
// theme therefore follows the user through console, Field and Virtual routes;
// Field is no longer a dark-locked channel. Authentication surfaces retain
// their approved dark first paint independently of the authenticated shell.
// Kept as a raw string (not a bundled module) so it executes synchronously.
// Dark-locked channels: sign-in and password reset only. The web application,
// including /field/**, keeps the light-or-persisted theme.
const THEME_INIT = `(function(){var f=/^\\/login(\\/|$)|^\\/reset(\\/|$)/.test(location.pathname);var t='light';if(f){t='dark';}else{try{var p=localStorage.getItem('saqeel-theme');if(p==='light'||p==='dark')t=p;}catch(e){}}document.documentElement.setAttribute('data-theme',t);})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
