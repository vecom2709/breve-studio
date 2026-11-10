#!/usr/bin/env python3
# Lokale Vorschau von Studio Breve. Bindet nur 127.0.0.1, nichts wird veröffentlicht.
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import socket
import sys
import threading
import time
import urllib.parse
import uuid
import webbrowser
from datetime import datetime, timedelta, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
DATA = ROOT / "inquiries.json"
ANALYTICS_DIR = ROOT / "data" / "analytics"
VISITS_FILE = ANALYTICS_DIR / "visits.jsonl"
DAILY_FILE = ANALYTICS_DIR / "daily.json"
SETTINGS_FILE = ANALYTICS_DIR / "settings.json"
HOST = "127.0.0.1"
PORT = 4173
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
DEFAULT_ADMIN_PASSWORD = "vorschau-lokal"
ADMIN_COOKIE = "sb_admin"
ADMIN_MAX_AGE = 60 * 60 * 12
ANALYTICS_TZ = ZoneInfo("Europe/Rome")
_login_attempts: dict[str, tuple[int, float]] = {}
_lock = threading.Lock()


def admin_password() -> str:
    return os.environ.get("ADMIN_PASSWORD") or DEFAULT_ADMIN_PASSWORD


def _scrypt(pw: str) -> bytes:
    return hashlib.scrypt(pw.encode("utf-8"), salt=b"studio-breve-admin", n=16384, r=8, p=1, dklen=32)


def verify_password(value: str) -> bool:
    a, b = _scrypt(value), _scrypt(admin_password())
    return hmac.compare_digest(a, b)


def allow_login(ip: str) -> bool:
    now = time.time()
    row = _login_attempts.get(ip)
    if not row or now > row[1]:
        _login_attempts[ip] = (1, now + 15 * 60)
        return True
    n, reset = row
    if n >= 5:
        return False
    _login_attempts[ip] = (n + 1, reset)
    return True


def _secret() -> bytes:
    return hashlib.sha256(("studio-breve-admin:" + admin_password()).encode()).digest()


def mint_session() -> str:
    ident = secrets.token_hex(16)
    exp = int(time.time()) + ADMIN_MAX_AGE
    sig = hmac.new(_secret(), f"{ident}.{exp}".encode(), "sha256").hexdigest()
    return f"{ident}.{exp}.{sig}"


def read_session(token: str | None) -> bool:
    if not token:
        return False
    parts = token.split(".")
    if len(parts) != 3:
        return False
    ident, exp, sig = parts
    try:
        if int(exp) < int(time.time()):
            return False
    except ValueError:
        return False
    expect = hmac.new(_secret(), f"{ident}.{exp}".encode(), "sha256").hexdigest()
    return hmac.compare_digest(sig, expect)


def cookie_header(value: str, max_age: int) -> str:
    return f"{ADMIN_COOKIE}={value}; Path=/; HttpOnly; SameSite=Strict; Max-Age={max_age}"


def cookie_from_header(header: str | None) -> str | None:
    if not header:
        return None
    for part in header.split(";"):
        part = part.strip()
        if part.startswith(ADMIN_COOKIE + "="):
            return part[len(ADMIN_COOKIE) + 1 :]
    return None


def today_stamp(d: datetime | None = None) -> str:
    d = d or datetime.now(ANALYTICS_TZ)
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(ANALYTICS_TZ).strftime("%Y-%m-%d")


def read_daily() -> dict:
    try:
        raw = json.loads(DAILY_FILE.read_text(encoding="utf-8"))
        return raw if isinstance(raw, dict) else {}
    except Exception:
        return {}


def unique_total() -> int:
    return sum(int(v or 0) for v in read_daily().values())


def read_settings() -> dict:
    try:
        raw = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
        return {"excludeAdmin": bool(raw.get("excludeAdmin"))}
    except Exception:
        return {"excludeAdmin": True}


def write_settings(next_val: dict) -> None:
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(next_val, indent=2) + "\n", encoding="utf-8")


def load_visits() -> list:
    try:
        rows = []
        for line in VISITS_FILE.read_text(encoding="utf-8").splitlines():
            if line.strip():
                rows.append(json.loads(line))
        cut = today_stamp(datetime.now(ANALYTICS_TZ) - timedelta(days=365))
        return [r for r in rows if r.get("date", "") >= cut]
    except Exception:
        return []


def save_visits(rows: list) -> None:
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    body = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    VISITS_FILE.write_text(body + ("\n" if rows else ""), encoding="utf-8")


def parse_ua(ua: str) -> dict:
    u = ua or ""
    browser = "Unbekannt"
    if re.search(r"Edg/", u, re.I):
        browser = "Edge"
    elif re.search(r"OPR/|Opera", u, re.I):
        browser = "Opera"
    elif re.search(r"Chrome/", u, re.I) and not re.search(r"Chromium", u, re.I):
        browser = "Chrome"
    elif re.search(r"Firefox/", u, re.I):
        browser = "Firefox"
    elif re.search(r"Safari", u, re.I) and not re.search(r"Chrome", u, re.I):
        browser = "Safari"
    os_name = "Unbekannt"
    if re.search(r"Windows NT", u, re.I):
        os_name = "Windows"
    elif re.search(r"Mac OS X", u, re.I):
        os_name = "macOS"
    elif re.search(r"Android", u, re.I):
        os_name = "Android"
    elif re.search(r"iPhone|iPad|iPod", u, re.I):
        os_name = "iOS"
    elif re.search(r"Linux", u, re.I):
        os_name = "Linux"
    device = "desktop"
    if re.search(r"iPad|Tablet|PlayBook", u, re.I) or (re.search(r"Android", u, re.I) and not re.search(r"Mobile", u, re.I)):
        device = "tablet"
    elif re.search(r"Mobi|iPhone|Android", u, re.I):
        device = "mobile"
    return {"browser": browser, "os": os_name, "device": device}


def country_from_lang(header: str | None) -> str | None:
    if not header:
        return None
    m = re.match(r"^[a-z]{2,3}[-_]([A-Z]{2})", header.split(",")[0].strip(), re.I)
    return m.group(1).upper() if m else None


def classify_source(referrer: str, utm) -> str:
    if isinstance(utm, dict) and (utm.get("source") or utm.get("medium") or utm.get("campaign")):
        return utm.get("source") or utm.get("medium") or "utm"
    if not referrer:
        return "direct"
    try:
        host = urllib.parse.urlparse(referrer).hostname or ""
        host = host.removeprefix("www.")
        if not host or host in ("127.0.0.1", "localhost") or host.endswith("studiobreve.it"):
            return "direct"
        return host
    except Exception:
        return "direct"


def record_view(payload: dict) -> dict:
    path_name = payload["path"]
    if path_name.startswith("/verwaltung") or path_name.startswith("/api/verwaltung"):
        return {"unique": False, "total": unique_total()}
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    date = today_stamp()
    with _lock:
        rows = load_visits()
        existing = next((r for r in rows if r.get("id") == payload["id"] and r.get("date") == date), None)
        if existing:
            if not any(p.get("path") == path_name and p.get("ms") is None for p in existing.get("pages", [])):
                existing.setdefault("pages", []).append({"path": path_name, "enteredAt": datetime.now(timezone.utc).isoformat()})
            save_visits(rows)
            return {"unique": False, "total": unique_total()}
        rows.append({
            "id": payload["id"],
            "date": date,
            "startedAt": datetime.now(timezone.utc).isoformat(),
            "pages": [{"path": path_name, "enteredAt": datetime.now(timezone.utc).isoformat()}],
            "referrer": str(payload.get("referrer") or "")[:500],
            "source": classify_source(payload.get("referrer") or "", payload.get("utm")),
            "utm": payload.get("utm"),
            "lang": str(payload.get("lang") or "")[:8],
            "country": payload.get("country"),
            "region": None,
            "city": None,
            "device": payload["device"],
            "os": payload["os"],
            "browser": payload["browser"],
            "screen": str(payload.get("screen") or "")[:20],
        })
        save_visits(rows)
        daily = read_daily()
        daily[date] = int(daily.get(date) or 0) + 1
        DAILY_FILE.write_text(json.dumps(daily) + "\n", encoding="utf-8")
        return {"unique": True, "total": sum(int(v or 0) for v in daily.values())}


def record_timing(ident: str, page_path: str, ms: float) -> None:
    if ms < 0:
        return
    date = today_stamp()
    with _lock:
        rows = load_visits()
        visit = next((r for r in rows if r.get("id") == ident and r.get("date") == date), None)
        if not visit:
            return
        for hit in reversed(visit.get("pages") or []):
            if hit.get("path") == page_path:
                hit["ms"] = min(int(ms), 1000 * 60 * 60 * 6)
                break
        save_visits(rows)


def _esc(v) -> str:
    return str(v or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def login_page(err: bool) -> str:
    err_html = """<p class="err" role="alert"><strong>Anmeldung fehlgeschlagen.</strong> Das Kennwort ist nicht richtig. Bitte prüfen Sie die Eingabe und versuchen Sie es erneut.</p>""" if err else ""
    return """<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Anmeldung — Verwaltung</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F7F8F6;font-family:system-ui,sans-serif;color:#14221f;padding:1.5rem}.card{width:min(26rem,100%);background:#fff;border:1px solid #d7ddd9;border-radius:18px;padding:2rem 1.8rem 1.6rem;display:grid;gap:1rem}.brand{display:flex;align-items:center;gap:.75rem;text-decoration:none;color:inherit}.brand img{width:44px;height:44px}.brand strong{display:block;font-weight:700}.brand small{color:#4a5b56}h1{font-size:1.45rem;margin:.2rem 0 0}p{margin:0;color:#4a5b56}form{display:grid;gap:.85rem}input{font:inherit;padding:.75rem .85rem;border:1px solid #c5cdc8;border-radius:10px}button{font:650 1rem/1 system-ui;background:#0f3b33;color:#fff;border:0;border-radius:999px;padding:.9rem 1.2rem;cursor:pointer}.err{color:#7a1515;background:#fdecec;border:1px solid #f0c4c4;border-radius:10px;padding:.8rem .9rem}.back{color:#0f3b33;font-weight:600;text-decoration:none}</style></head>
  <body><div class="card"><a class="brand" href="/de/"><img src="/logo-studio-breve.svg" width="44" height="44" alt=""><span><strong>Studio Breve</strong><small>Digitalstudio · Aragona, Sizilien</small></span></a>
  <h1>Anmeldung zur Verwaltung</h1>
  <p>Geschützter Bereich für den Betreiber. Der Link steht dezent im Fußbereich der Website.</p>
  __ERR__
  <form method="post" action="/api/verwaltung/login/"><label for="password">Kennwort</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Anmelden</button></form>
  <a class="back" href="/de/">← Zurück zur Website</a></div></body></html>""".replace("__ERR__", err_html)


def dashboard_page(query: str) -> str:
    qs = urllib.parse.parse_qs(query)
    von = (qs.get("von") or [""])[0]
    bis = (qs.get("bis") or [""])[0]
    ok = (qs.get("ok") or [""])[0] == "1"
    daily = read_daily()
    today = today_stamp()
    def days_ago(n: int) -> str:
        return today_stamp(datetime.now(ANALYTICS_TZ) - timedelta(days=n))
    def sum_range(from_d: str) -> int:
        return sum(int(v or 0) for d, v in daily.items() if d >= from_d)
    visits = load_visits()
    if von:
        visits = [v for v in visits if v.get("date", "") >= von]
    if bis:
        visits = [v for v in visits if v.get("date", "") <= bis]
    pages: dict[str, int] = {}
    for v in visits:
        for pth in v.get("pages") or []:
            pages[pth.get("path", "")] = pages.get(pth.get("path", ""), 0) + 1
    top_pages = sorted(pages.items(), key=lambda x: -x[1])[:12]
    def count_by(fn):
        m: dict[str, int] = {}
        for v in visits:
            k = fn(v) or "—"
            m[k] = m.get(k, 0) + 1
        return sorted(m.items(), key=lambda x: -x[1])
    sources = count_by(lambda v: v.get("source"))[:12]
    countries = count_by(lambda v: " · ".join(x for x in (v.get("country"), v.get("region"), v.get("city")) if x) or "unbekannt")[:12]
    devices = count_by(lambda v: v.get("device"))
    browsers = count_by(lambda v: v.get("browser"))
    recent = sorted(visits, key=lambda v: v.get("startedAt", ""), reverse=True)[:40]
    export_q = urllib.parse.urlencode({k: v for k, v in {"von": von, "bis": bis}.items() if v})
    export_href = "/api/verwaltung/export/" + (("?" + export_q) if export_q else "")
    def table(heads, rows):
        if not rows:
            return '<p>Keine Daten.</p>'
        h = "".join(f"<th>{_esc(x)}</th>" for x in heads)
        body = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
        return f"<table><thead><tr>{h}</tr></thead><tbody>{body}</tbody></table>"
    settings = read_settings()
    checked = "checked" if settings.get("excludeAdmin") else ""
    return f"""<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Besuche — Verwaltung</title>
    <style>body{{margin:0;background:#F7F8F6;font-family:system-ui;color:#14221f}}header{{display:flex;justify-content:space-between;padding:1rem 1.5rem;background:#fff;border-bottom:1px solid #d7ddd9}}main{{max-width:72rem;margin:0 auto;padding:1.25rem 1.5rem;display:grid;gap:1.25rem}}.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:.8rem}}.kpi,.card{{background:#fff;border:1px solid #d7ddd9;border-radius:12px;padding:1rem}}table{{width:100%;border-collapse:collapse}}th,td{{text-align:left;padding:.4rem;border-bottom:1px solid #d7ddd9}}button,.btn{{background:#0f3b33;color:#fff;border:0;border-radius:999px;padding:.55rem .95rem;text-decoration:none;display:inline-block}}.ghost{{background:transparent;color:#0f3b33;border:1px solid #d7ddd9}}.row{{display:flex;flex-wrap:wrap;gap:.6rem}}</style></head>
    <body><header><h1>Besuche — Studio Breve</h1><form method="post" action="/api/verwaltung/logout/"><button class="ghost" type="submit">Abmelden</button></form></header>
    <main>
    {"<p>Einstellung gespeichert.</p>" if ok else ""}
    <section class="kpis"><div class="kpi"><b>{daily.get(today, 0)}</b><span>Heute</span></div><div class="kpi"><b>{sum_range(days_ago(6))}</b><span>7 Tage</span></div><div class="kpi"><b>{sum_range(days_ago(29))}</b><span>30 Tage</span></div><div class="kpi"><b>{unique_total()}</b><span>Seit Start</span></div></section>
    <form class="row card" method="get" action="/verwaltung/"><label>Von <input type="date" name="von" value="{_esc(von)}"></label><label>Bis <input type="date" name="bis" value="{_esc(bis)}"></label><button type="submit">Filtern</button><a class="btn ghost" href="/verwaltung/">Zurücksetzen</a><a class="btn ghost" href="{export_href}">CSV exportieren</a></form>
    <section class="card"><h2>Häufigste Seiten</h2>{table(["Pfad","Aufrufe"], [(_esc(a), n) for a,n in top_pages])}</section>
    <section class="card"><h2>Quellen</h2>{table(["Quelle","Besuche"], [(_esc(a), n) for a,n in sources])}</section>
    <section class="card"><h2>Länder und Orte</h2>{table(["Ort","Besuche"], [(_esc(a), n) for a,n in countries])}</section>
    <section class="card"><h2>Geräte und Browser</h2>{table(["Merkmal","Anzahl"], [("Gerät: "+_esc(a), n) for a,n in devices]+[("Browser: "+_esc(a), n) for a,n in browsers])}</section>
    <section class="card"><h2>Letzte Besuche</h2>{table(["Zeit","Sprache","Gerät","Quelle","Seiten"], [
        (_esc(str(v.get("startedAt","")).replace("T"," ")[:19]), _esc(v.get("lang")), _esc(f"{v.get('device')} · {v.get('os')} · {v.get('browser')}"), _esc(v.get("source")),
         _esc(" → ".join(f"{p.get('path','')}" + (f" ({int(p['ms'])//1000}s)" if p.get("ms") is not None else "") for p in v.get("pages") or [])))
        for v in recent
    ])}</section>
    <section class="card"><h2>Einstellungen</h2>
      <form method="post" action="/api/verwaltung/settings/">
        <label><input type="checkbox" name="excludeAdmin" value="yes" {checked}> Eigene Besuche aus der Verwaltung nicht mitzählen</label>
        <p><button type="submit">Speichern</button></p>
      </form>
    </section>
    </main></body></html>"""


LEGACY_EXACT = {
    "/pakete/": "/de/pakete/",
    "/kontakt/": "/de/kontakt/",
    "/kontakt/danke/": "/de/kontakt/danke/",
    "/ueber-uns/": "/de/ueber-uns/",
    "/impressum/": "/de/impressum/",
    "/datenschutz/": "/de/datenschutz/",
    "/agb/": "/de/agb/",
}


def legacy_redirect(pathname: str, query: str) -> str | None:
    """Alte deutsche URLs ohne /de/-Präfix auf die neue Struktur umleiten."""
    with_slash = pathname if pathname.endswith("/") else pathname + "/"
    dest = LEGACY_EXACT.get(with_slash)
    if dest is None and with_slash.startswith("/pakete/") and with_slash != "/pakete/":
        dest = "/de" + with_slash
    if dest is None:
        return None
    return dest + (("?" + query) if query else "")


def parse_form(handler) -> dict[str, str]:
    length = int(handler.headers.get("Content-Length") or "0")
    raw = handler.rfile.read(length)
    ctype = handler.headers.get("Content-Type", "")
    if "application/x-www-form-urlencoded" in ctype:
        pairs = urllib.parse.parse_qs(raw.decode("utf-8", "replace"), keep_blank_values=True)
        return {k: (v[-1] if v else "") for k, v in pairs.items()}
    if "multipart/form-data" in ctype:
        m = re.search(r'boundary=(?:"([^"]+)"|([^;]+))', ctype)
        if not m:
            return {}
        boundary = (m.group(1) or m.group(2)).encode("utf-8")
        out: dict[str, str] = {}
        for part in raw.split(b"--" + boundary):
            if not part or part in (b"--", b"--\r\n") or part.startswith(b"--"):
                continue
            if part.startswith(b"\r\n"):
                part = part[2:]
            header, sep, body = part.partition(b"\r\n\r\n")
            if not sep:
                continue
            body = body.removesuffix(b"\r\n")
            hm = re.search(br'name="([^"]+)"', header)
            if hm:
                out[hm.group(1).decode("utf-8", "replace")] = body.decode("utf-8", "replace")
        return out
    # try urlencoded anyway
    try:
        pairs = urllib.parse.parse_qs(raw.decode("utf-8", "replace"), keep_blank_values=True)
        return {k: (v[-1] if v else "") for k, v in pairs.items()}
    except Exception:
        return {}


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def translate_path(self, path):
        # Serve directory URLs as index.html, like the real site.
        parsed = urllib.parse.urlsplit(path)
        rel = urllib.parse.unquote(parsed.path)
        if rel.endswith("/"):
            candidate = SITE / rel.lstrip("/") / "index.html"
            if candidate.is_file():
                return str(candidate)
        else:
            as_file = SITE / rel.lstrip("/")
            if as_file.is_file():
                return str(as_file)
            as_index = SITE / rel.lstrip("/") / "index.html"
            if as_index.is_file():
                # Ask the browser to use the trailing-slash URL
                return str(as_index)
        return super().translate_path(path)

    def _is_authed(self) -> bool:
        return read_session(cookie_from_header(self.headers.get("Cookie")))

    def _send_json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, code: int, html: str, extra=None) -> None:
        body = html.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        if extra:
            for k, v in extra:
                self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _redirect(self, location: str, code: int = 303, cookie: str | None = None) -> None:
        self.send_response(code)
        self.send_header("Location", location)
        if cookie is not None:
            self.send_header("Set-Cookie", cookie)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        rel = urllib.parse.unquote(parsed.path)
        clean = rel.rstrip("/") or "/"
        if clean == "/api/track":
            self._send_json(200, {"n": unique_total()})
            return
        if clean == "/api/verwaltung/export":
            if not self._is_authed():
                self._redirect("/verwaltung/anmelden/")
                return
            qs = urllib.parse.parse_qs(parsed.query)
            von = (qs.get("von") or [""])[0]
            bis = (qs.get("bis") or [""])[0]
            rows = load_visits()
            if von:
                rows = [r for r in rows if r.get("date", "") >= von]
            if bis:
                rows = [r for r in rows if r.get("date", "") <= bis]
            header = ["id","date","startedAt","lang","country","device","os","browser","screen","source","referrer","pages"]
            def q(v):
                return '"' + str(v or "").replace('"', '""') + '"'
            lines = [",".join(header)]
            for r in rows:
                pages = " > ".join(f"{p.get('path','')}" + (f"({p['ms']}ms)" if p.get("ms") is not None else "") for p in r.get("pages") or [])
                lines.append(",".join(q(x) for x in [r.get("id"), r.get("date"), r.get("startedAt"), r.get("lang"), r.get("country"), r.get("device"), r.get("os"), r.get("browser"), r.get("screen"), r.get("source"), r.get("referrer"), pages]))
            body = ("\ufeff" + "\n".join(lines) + "\n").encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="studio-breve-besuche.csv"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if clean == "/verwaltung/anmelden":
            if self._is_authed():
                self._redirect("/verwaltung/")
                return
            self._send_html(200, login_page("fehler=1" in parsed.query))
            return
        if clean == "/verwaltung":
            if not self._is_authed():
                self._redirect("/verwaltung/anmelden/")
                return
            self._send_html(200, dashboard_page(parsed.query))
            return
        legacy = legacy_redirect(rel, parsed.query)
        if legacy:
            self.send_response(301)
            self.send_header("Location", legacy)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        if not rel.endswith("/"):
            as_index = SITE / rel.lstrip("/") / "index.html"
            if as_index.is_file():
                self.send_response(308)
                self.send_header("Location", rel + "/" + (("?" + parsed.query) if parsed.query else ""))
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
        if parsed.path.rstrip("/") == "/api/inquiry":
            self.send_error(405, "Method Not Allowed")
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlsplit(self.path)
        clean = parsed.path.rstrip("/") or "/"
        if clean == "/api/track":
            if (self.headers.get("Dnt") == "1" or self.headers.get("Sec-Gpc") == "1"):
                self._send_json(200, {"ok": True, "ignored": "dnt", "n": unique_total()})
                return
            if read_settings().get("excludeAdmin") and self._is_authed():
                self._send_json(200, {"ok": True, "ignored": "admin", "n": unique_total()})
                return
            length = int(self.headers.get("Content-Length") or "0")
            raw = self.rfile.read(length)
            try:
                body = json.loads(raw.decode("utf-8") or "{}")
            except Exception:
                self._send_json(400, {"ok": False})
                return
            sid = str(body.get("sid") or "")
            path_name = str(body.get("path") or "/")
            if not re.match(r"^[A-Za-z0-9._:-]{8,80}$", sid) or not path_name.startswith("/") or len(path_name) > 300:
                self._send_json(400, {"ok": False})
                return
            if body.get("t") == "timing":
                try:
                    record_timing(sid, path_name, float(body.get("ms") or 0))
                except Exception:
                    pass
                self._send_json(200, {"ok": True})
                return
            ua = parse_ua(self.headers.get("User-Agent") or "")
            result = record_view({
                "id": sid,
                "path": path_name,
                "referrer": str(body.get("referrer") or ""),
                "utm": body.get("utm") if isinstance(body.get("utm"), dict) else None,
                "lang": str(body.get("lang") or ""),
                "country": country_from_lang(self.headers.get("Accept-Language")),
                "device": ua["device"],
                "os": ua["os"],
                "browser": ua["browser"],
                "screen": str(body.get("screen") or ""),
            })
            self._send_json(200, {"ok": True, "unique": result["unique"], "n": result["total"]})
            return
        if clean == "/api/verwaltung/login":
            ip = (self.headers.get("X-Forwarded-For") or self.client_address[0] or "127.0.0.1").split(",")[0].strip()
            if not allow_login(re.sub(r"\d+$", "0", ip)):
                self.send_error(429, "Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.")
                return
            form = parse_form(self)
            if not verify_password(form.get("password") or ""):
                self._redirect("/verwaltung/anmelden/?fehler=1")
                return
            self._redirect("/verwaltung/", cookie=cookie_header(mint_session(), ADMIN_MAX_AGE))
            return
        if clean == "/api/verwaltung/logout":
            self._redirect("/verwaltung/anmelden/", cookie=cookie_header("", 0))
            return
        if clean == "/api/verwaltung/settings":
            if not self._is_authed():
                self._redirect("/verwaltung/anmelden/")
                return
            form = parse_form(self)
            write_settings({"excludeAdmin": form.get("excludeAdmin") == "yes"})
            self._redirect("/verwaltung/?ok=1")
            return
        if parsed.path.rstrip("/") != "/api/inquiry":
            self.send_error(405, "Method Not Allowed")
            return
        form = parse_form(self)
        s = lambda k, mx=4000: str(form.get(k, "")).strip()[:mx]
        wants_json = "application/json" in (self.headers.get("Accept") or "")
        lang = "it" if s("lang") == "it" else "de"
        back = s("source", 200) if s("source", 200).startswith("/") else ("/it/contatti/" if lang == "it" else "/de/kontakt/")

        def send_json(code, payload):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def send_redirect(location, code=303):
            self.send_response(code)
            self.send_header("Location", location)
            self.send_header("Content-Length", "0")
            self.end_headers()

        if s("website"):
            send_json(400, {"ok": False}) if wants_json else send_redirect(f"{back}?fehler=1#formular")
            return

        name, email, message = s("name", 120), s("email", 200), s("message", 4000)
        consent = s("consent") == "yes"
        errors = {}
        if len(name) < 2:
            errors["name"] = True
        if not EMAIL_RE.match(email):
            errors["email"] = True
        if len(message) < 10:
            errors["message"] = True
        if not consent:
            errors["consent"] = True
        if errors:
            if wants_json:
                send_json(422, {"ok": False, "errors": errors})
            else:
                send_redirect(f"{back}?fehler=1#formular")
            return

        pref = s("language")
        preferred = pref if pref in ("it", "en") else "de"
        rec_id = "prev-" + uuid.uuid4().hex[:12]
        record = {
            "id": rec_id,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "siteLang": lang,
            "preferredLanguage": preferred,
            "name": name,
            "email": email,
            "package": s("package", 80) or None,
            "intent": s("intent", 20) or "general",
            "message": message,
            "consent": {
                "processing": True,
                "marketing": s("marketing") == "yes",
                "textVersion": "consent-2026-11-09",
            },
            "source": back,
        }
        existing = []
        if DATA.is_file():
            try:
                existing = json.loads(DATA.read_text(encoding="utf-8"))
                if not isinstance(existing, list):
                    existing = []
            except Exception:
                existing = []
        existing.append(record)
        DATA.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        thanks = "/it/contatti/grazie/" if lang == "it" else "/de/kontakt/danke/"
        redirect = f"{thanks}?ref={urllib.parse.quote(rec_id)}"
        if wants_json:
            send_json(201, {"ok": True, "id": rec_id, "redirect": redirect})
        else:
            send_redirect(redirect)


def port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((HOST, port))
            return True
        except OSError:
            return False


def main() -> int:
    if not (SITE / "index.html").is_file():
        print("Die Ordnerdateien fehlen: 'site/index.html' wurde nicht gefunden.", file=sys.stderr)
        return 1
    port = PORT
    if not port_free(port):
        for cand in range(4174, 4190):
            if port_free(cand):
                port = cand
                break
        else:
            print("Kein freier Port zwischen 4173 und 4189. Bitte einen belegten Vorschau-Prozess beenden.", file=sys.stderr)
            return 1
    httpd = ThreadingHTTPServer((HOST, port), PreviewHandler)
    url = f"http://{HOST}:{port}/"
    print()
    print("Studio Breve – lokale Vorschau (nicht veröffentlicht)")
    print(f"Sprachwahl:  {url}")
    print(f"Deutsch:     http://{HOST}:{port}/de/")
    print(f"Italienisch: http://{HOST}:{port}/it/")
    print(f"Verwaltung:  http://{HOST}:{port}/verwaltung/")
    if not os.environ.get("ADMIN_PASSWORD"):
        print("Kennwort (nur lokal, bitte ändern): " + DEFAULT_ADMIN_PASSWORD)
    else:
        print("Kennwort:    aus ADMIN_PASSWORD")
    print("Zum Beenden: Strg+C")
    print()
    threading.Thread(target=lambda: (time.sleep(0.4), webbrowser.open(url)), daemon=True).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nVorschau beendet.")
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
