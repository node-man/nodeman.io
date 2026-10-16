// Offline stand-in for Google Fonts used ONLY for local verification builds in
// sandboxes that cannot reach fonts.googleapis.com. CI builds use the real fonts.
// Usage: NEXT_FONT_GOOGLE_MOCKED_RESPONSES=$PWD/scripts/radar/font-mock.cjs npm run build
const css = (family) =>
  `@font-face { font-family: '${family}'; font-style: normal; font-weight: 400; src: local('Arial'); }`;
module.exports = new Proxy({}, {
  get: (_t, url) => {
    const m = String(url).match(/family=([^:&]+)/);
    return css(m ? decodeURIComponent(m[1]).replace(/\+/g, " ") : "Mock");
  },
});
