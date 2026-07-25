// Blocking theme resolver — runs in <head> before first paint so there is no
// light-then-dark flash.
//
// Channel-dependent theme: the web console keeps the sponsor-approved
// government light theme and remains user-switchable, while the field channel
// (the iPad inspector app and its sign-in surface) is ALWAYS dark. The field
// app is used outdoors and at night, and its design source paints the darkest
// surface in the ramp.
//
// On the field channel the persisted `saqeel-theme` value is deliberately
// ignored rather than merely defaulted: the theme is fixed, so the field
// surfaces expose no theme control (see FieldHeader / FieldSettingsClient /
// FieldLoginClient). A console user's dark-or-light choice still persists and
// still applies to every web route — it just does not follow them into /field.
//
// Accessibility note: this removes user theme control on that channel. It is a
// deliberate, sponsor-directed product decision, not an oversight; if a
// light-preferring field user needs it back, the control returns here.
// Kept as a raw string (not a bundled module) so it executes synchronously.
// Dark-locked channels: the field channel (/field*, /login/field*) AND the
// unified sign-in (/login*). The web console keeps the light-or-persisted
// theme; the sign-in surface is always dark and exposes no theme control.
const THEME_INIT = `(function(){var f=/^\\/field(\\/|$)|^\\/login(\\/|$)/.test(location.pathname);var t='light';if(f){t='dark';}else{try{var p=localStorage.getItem('saqeel-theme');if(p==='light'||p==='dark')t=p;}catch(e){}}document.documentElement.setAttribute('data-theme',t);})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
