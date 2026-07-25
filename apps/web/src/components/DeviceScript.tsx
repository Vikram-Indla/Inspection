// Blocking device resolver — runs in <head> before first paint, mirroring
// ThemeScript, so the login can render the PWA card (no atlas) on iPad with no
// atlas flash.
//
// Why this exists in addition to the CSS `@media (hover:none) and
// (pointer:coarse)` rule in login.css: that media query already handles iPad in
// normal browsing (both orientations, any width) by reading the hardware input.
// The one case it misses is iPad in "Request Desktop Website" mode, where Safari
// can report a desktop mouse pointer AND a desktop Mac user-agent. `maxTouchPoints`
// still reflects the real hardware there (an iPad reports >1; a Mac reports 0),
// so pairing it with the Mac platform string catches the spoofed case that UA
// sniffing alone cannot. Sets data-device="ipad"; login.css keys off it.
//
// Kept as a raw string (not a bundled module) so it executes synchronously.
const DEVICE_INIT = `(function(){try{var n=navigator;var t=n.maxTouchPoints||0;var ua=n.userAgent||'';var plat=(n.userAgentData&&n.userAgentData.platform)||n.platform||'';var ipad=/iPad/.test(ua)||(t>1&&/Mac/i.test(plat));if(ipad)document.documentElement.setAttribute('data-device','ipad');}catch(e){}})();`;

export default function DeviceScript() {
  return <script dangerouslySetInnerHTML={{ __html: DEVICE_INIT }} />;
}
