import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Notes.css";

const STORAGE_KEY = "mdNotes";

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* storage full or unavailable — fail quietly */
  }
}

function newNote() {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: "Untitled note",
    body: "",
    updated: Date.now(),
  };
}

// Escapes raw HTML in the user's text before we add our own markdown tags,
// so pasted "<script>" etc. never executes.
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A small, dependency-free markdown → HTML converter covering the common
// cases: headers, bold/italic, inline code, code blocks, links, lists,
// blockquotes, and horizontal rules.
function markdownToHtml(src) {
  const escaped = escapeHtml(src);
  const lines = escaped.split("\n");
  const out = [];
  let inCode = false;
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (let raw of lines) {
    if (raw.trim().startsWith("```")) {
      inCode = !inCode;
      out.push(inCode ? "<pre><code>" : "</code></pre>");
      continue;
    }
    if (inCode) {
      out.push(raw + "\n");
      continue;
    }

    if (/^\s*$/.test(raw)) {
      closeList();
      out.push("");
      continue;
    }
    if (/^---+$/.test(raw.trim())) {
      closeList();
      out.push("<hr/>");
      continue;
    }

    const h = raw.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      closeList();
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    const quote = raw.match(/^>\s?(.*)/);
    if (quote) {
      closeList();
      out.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      continue;
    }

    const item = raw.match(/^\s*[-*]\s+(.*)/);
    if (item) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(item[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inline(raw)}</p>`);
  }
  closeList();
  return out.join("\n");
}

function inline(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Notes() {
  const [notes, setNotes] = useState(loadNotes);
  const [activeId, setActiveId] = useState(() => notes[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);
  const [glowOn, setGlowOn] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => saveNotes(notes), [notes]);

  const active = notes.find((n) => n.id === activeId) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...notes].sort((a, b) => b.updated - a.updated);
    if (!q) return sorted;
    return sorted.filter(
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const html = useMemo(() => (active ? markdownToHtml(active.body) : ""), [active]);

  const addNote = () => {
    const n = newNote();
    setNotes((ns) => [n, ...ns]);
    setActiveId(n.id);
    setPreview(false);
    // give React a tick to mount the textarea, then focus it so mobile
    // keyboards pop up immediately
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const updateActive = (patch) => {
    if (!active) return;
    setNotes((ns) =>
      ns.map((n) => (n.id === active.id ? { ...n, ...patch, updated: Date.now() } : n))
    );
  };

  const deleteActive = () => {
    if (!active) return;
    const rest = notes.filter((n) => n.id !== active.id);
    setNotes(rest);
    setActiveId(rest[0]?.id ?? null);
  };

  const openNote = (id) => {
    setActiveId(id);
    setPreview(false);
  };

  return (
    <div className="notes-page">
      <div className="notes-ambient" aria-hidden="true" />

      <div className="notes-shell">
        <div className="notes-topbar">
          <Link to="/" className="notes-back">
            ← Home
          </Link>
          <h1 className="notes-title">Markdown Notes</h1>
          <button
            className={`pill${glowOn ? " pill--on" : ""}`}
            onClick={() => setGlowOn((v) => !v)}
          >
            RGB Border
          </button>
        </div>

        <div className={`notes-body${glowOn ? " notes-body--glow" : ""}`}>
          <aside className="notes-sidebar">
            <div className="notes-sidebar-head">
              <input
                className="notes-search"
                type="text"
                placeholder="Search notes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="notes-add" onClick={addNote} title="New note">
                +
              </button>
            </div>

            <ul className="notes-list">
              {filtered.length === 0 && (
                <li className="notes-empty">No notes yet — tap + to start.</li>
              )}
              {filtered.map((n) => (
                <li
                  key={n.id}
                  className={`notes-item${n.id === activeId ? " notes-item--active" : ""}`}
                  onClick={() => openNote(n.id)}
                >
                  <span className="notes-item-title">{n.title || "Untitled note"}</span>
                  <span className="notes-item-meta">{timeAgo(n.updated)}</span>
                </li>
              ))}
            </ul>
          </aside>

          <section className="notes-editor">
            {!active ? (
              <div className="notes-placeholder">
                <p>Select a note, or create a new one.</p>
                <button className="notes-add notes-add--big" onClick={addNote}>
                  + New note
                </button>
              </div>
            ) : (
              <>
                <div className="notes-editor-head">
                  <input
                    className="notes-title-input"
                    type="text"
                    value={active.title}
                    onChange={(e) => updateActive({ title: e.target.value })}
                    placeholder="Note title"
                  />
                  <div className="notes-editor-actions">
                    <button
                      className={`pill${!preview ? " pill--on" : ""}`}
                      onClick={() => setPreview(false)}
                    >
                      Write
                    </button>
                    <button
                      className={`pill${preview ? " pill--on" : ""}`}
                      onClick={() => setPreview(true)}
                    >
                      Preview
                    </button>
                    <button className="pill pill--danger" onClick={deleteActive}>
                      Delete
                    </button>
                  </div>
                </div>

                {!preview ? (
                  <textarea
                    ref={textareaRef}
                    className="notes-textarea"
                    value={active.body}
                    onChange={(e) => updateActive({ body: e.target.value })}
                    placeholder="Write in Markdown — **bold**, *italic*, # headers, - lists, `code`…"
                    // inputMode "text" (the default) keeps the normal full
                    // keyboard on phones; autoCapitalize off keeps markdown
                    // syntax like ** and # from getting auto-capitalized
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="true"
                  />
                ) : (
                  <div
                    className="notes-preview"
                    dangerouslySetInnerHTML={{ __html: html || "<p><em>Nothing to preview yet.</em></p>" }}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}