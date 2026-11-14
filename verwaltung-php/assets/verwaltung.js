/* Verwaltung Studio Breve – kleine Helfer: Link kopieren, QR-Code zeichnen und als Bild speichern (qrcode.js, MIT) */
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-kopieren]');
    if (!b) return;
    var f = document.getElementById(b.getAttribute('data-kopieren'));
    if (!f) return;
    var fertig = function () { var t = b.textContent; b.textContent = 'Kopiert ✓'; setTimeout(function () { b.textContent = t; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(f.value).then(fertig, function () { f.select(); document.execCommand('copy'); fertig(); });
    else { f.select(); document.execCommand('copy'); fertig(); }
  });

  var feld = document.querySelector('[data-qr]');
  if (!feld || typeof qrcode !== 'function') return;
  var qr = qrcode(0, 'M');
  qr.addData(feld.getAttribute('data-qr'));
  qr.make();
  var n = qr.getModuleCount(), rand = 4, gesamt = n + 2 * rand, pfad = '';
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) pfad += 'M' + (c + rand) + ' ' + (r + rand) + 'h1v1h-1z';
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + gesamt + ' ' + gesamt);
  svg.setAttribute('shape-rendering', 'crispEdges');
  var hg = document.createElementNS(ns, 'rect'); hg.setAttribute('width', gesamt); hg.setAttribute('height', gesamt); hg.setAttribute('fill', '#fff');
  var p = document.createElementNS(ns, 'path'); p.setAttribute('d', pfad); p.setAttribute('fill', '#000');
  svg.appendChild(hg); svg.appendChild(p); feld.appendChild(svg);

  var knopf = document.querySelector('[data-qr-speichern]');
  if (knopf) knopf.addEventListener('click', function () {
    var zelle = 16, cv = document.createElement('canvas');
    cv.width = cv.height = gesamt * zelle;
    var g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + rand) * zelle, (r + rand) * zelle, zelle, zelle);
    var a = document.createElement('a');
    a.download = 'studio-breve-qr.png';
    a.href = cv.toDataURL('image/png');
    document.body.appendChild(a); a.click(); a.remove();
  });
})();
