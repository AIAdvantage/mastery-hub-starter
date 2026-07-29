import { useCallback, useEffect, useMemo, useState } from "react";

const STATUSES = [
  { key: "new", label: "Inbox", userLabel: "Submitted", icon: "📥" },
  { key: "planned", label: "Planning", userLabel: "Planning", icon: "🧭" },
  { key: "in-progress", label: "Doing", userLabel: "In progress", icon: "🛠️" },
  { key: "done", label: "Done", userLabel: "Done", icon: "✅" },
];

const REQUEST_AREAS = ["Platform", "Month Content", "Guide", "Workshop", "Challenge", "Resources", "Member Experience", "Backend", "Other"];

const PLANNING_PRESETS = [
  {
    id: "quick-direction",
    label: "Quick Direction",
    description: "Small request. Shortest useful path and next step.",
    instruction: "Create a concise plan with a summary, recommended direction, 3-5 concrete steps, and acceptance criteria.",
  },
  {
    id: "options",
    label: "Options",
    description: "Use when Igor needs a few choices first.",
    instruction: "Create 2-3 useful options only if they matter. Put the recommended option first and explain tradeoffs plainly.",
  },
  {
    id: "build-spec",
    label: "Build Spec",
    description: "Feature or workflow build translated into implementation shape.",
    instruction: "Create an implementation-ready plan with user experience, data/state, admin controls, visibility rules, implementation notes, and QA.",
  },
  {
    id: "audit-fix",
    label: "Audit + Fix",
    description: "Messy area. Diagnose what is wrong, then clean it up.",
    instruction: "Create a plan with what is confusing, what should be true, the smallest remediation path, risks, and verification steps.",
  },
  {
    id: "product-redesign",
    label: "Product Redesign",
    description: "Member-facing UX or journey decision.",
    instruction: "Create a plan with current pain, target experience, key decisions, recommended direction, rollout, and what members/admins see.",
  },
  {
    id: "ops-workflow",
    label: "Ops Workflow",
    description: "Statuses, queues, approvals, roles, or admin workflow cleanup.",
    instruction: "Create a workflow plan with source of truth, visible statuses, admin-only details, queue movement, and edge cases.",
  },
];

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const FILE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx,.zip";

function actorFromUser(user) {
  return {
    id: user?.id || "",
    name: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Mastery team",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl || "",
  };
}

async function requestFetch(token, path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function uploadFiles(token, files, requestKey) {
  const attachments = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 2 MB.`);
    const extension = file.name.split(".").pop()?.toLowerCase();
    const contentType = file.type || {
      txt: "text/plain",
      csv: "text/csv",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip: "application/zip",
    }[extension] || "";
    const data = await requestFetch(token, "/api/mastery-admin", {
      method: "POST",
      body: JSON.stringify({
        action: "upload-request-file",
        request_key: requestKey,
        file_name: file.name,
        content_type: contentType,
        data: await readFileAsDataUrl(file),
      }),
    });
    attachments.push(data.attachment);
  }
  return attachments;
}

function statusConfig(status) {
  return STATUSES.find((item) => item.key === status) || STATUSES[0];
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function summarizeText(text, max = 170) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function summarizePlanNotes(notes) {
  if (!notes) return "";
  const lines = String(notes)
    .split("\n")
    .map((line) => line.replace(/^[-*#>\s]+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean)
    .filter((line) => !/^(request|request id|priority|area|planning preset|alfredo instructions|source request|next step|attachments)/i.test(line));
  const summaryLine = lines.find((line) => /^summary:/i.test(line));
  if (summaryLine) return summarizeText(summaryLine.replace(/^summary:\s*/i, ""), 220);
  return summarizeText(lines[0] || notes, 220);
}

function buildPlanningBrief(item, preset, actor, existingNotes = "") {
  const summary = summarizeText(item.description, 240);
  const humanNotes = /Planning preset:/i.test(existingNotes) ? "" : existingNotes.trim();
  const lines = [
    `Summary: ${summary}`,
    "",
    `Planning preset: ${preset.label}`,
    `Alfredo instructions: ${preset.instruction}`,
    "",
    "Source request",
    `Request ID: ${item.id}`,
    `Title: ${item.title}`,
    `Area: ${item.area || "Platform"}`,
    `Priority: ${item.priority || "medium"}`,
    `Submitted by: ${item.submitted_by_name || "Unknown"}`,
    "",
    item.description,
  ];
  if (humanNotes) {
    lines.push("", "Existing notes", humanNotes);
  }
  lines.push("", `Next step: Alfredo creates a concise plan and keeps this request as the source of truth.`);
  lines.push(`Queued by: ${actor.name}`);
  return lines.join("\n");
}

function buildAlfredoPayload(item, notes = "") {
  return [
    "MASTERY HUB REQUEST",
    "",
    item.title,
    `Request ID: ${item.id}`,
    `Area: ${item.area || "Platform"}`,
    `Priority: ${item.priority || "medium"}`,
    `Status: ${statusConfig(item.status).label}`,
    `Submitted by: ${item.submitted_by_name || "Unknown"}`,
    "",
    "Request",
    item.description,
    notes?.trim() ? ["", "Planning / admin notes", notes.trim()].join("\n") : "",
    (item.attachments || []).length ? ["", `Attachments: ${item.attachments.length}`, ...(item.attachments || []).map((file) => `- ${file.name}: ${file.url || file.path}`)].join("\n") : "",
    "",
    `When done, update mastery_admin_requests id ${item.id} to status done and add the completion note in the request thread.`,
  ].filter(Boolean).join("\n");
}

export default function MasteryRequests({ token, user }) {
  const actor = useMemo(() => actorFromUser(user), [user]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftFiles, setDraftFiles] = useState([]);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    area: "Platform",
    priority: "medium",
  });

  const loadRequests = useCallback(async () => {
    setError("");
    try {
      const data = await requestFetch(token, "/api/mastery-admin?action=requests");
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function createRequest(event) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.description.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await requestFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({ action: "create-request", actor, ...draft }),
      });
      if (draftFiles.length) {
        const attachments = await uploadFiles(token, draftFiles, created.request.id);
        await requestFetch(token, "/api/mastery-admin", {
          method: "POST",
          body: JSON.stringify({
            action: "update-request",
            request_id: created.request.id,
            actor,
            patch: { attachments },
          }),
        });
      }
      setDraft({ title: "", description: "", area: "Platform", priority: "medium" });
      setDraftFiles([]);
      setShowForm(false);
      await loadRequests();
    } catch (err) {
      setError(err.message);
      await loadRequests();
    } finally {
      setSaving(false);
    }
  }

  async function updateRequest(id, patch) {
    setRequests((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    try {
      await requestFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({ action: "update-request", request_id: id, actor, patch }),
      });
      await loadRequests();
    } catch (err) {
      setError(err.message);
      await loadRequests();
      throw err;
    }
  }

  async function deleteRequest(item) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await requestFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({ action: "delete-request", request_id: item.id, actor }),
      });
      setOpenId("");
      await loadRequests();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addComment(requestId, body) {
    if (!body.trim()) return;
    await requestFetch(token, "/api/mastery-admin", {
      method: "POST",
      body: JSON.stringify({ action: "create-request-comment", request_id: requestId, actor, body }),
    });
    await loadRequests();
  }

  async function deleteComment(commentId) {
    await requestFetch(token, "/api/mastery-admin", {
      method: "POST",
      body: JSON.stringify({ action: "delete-request-comment", comment_id: commentId, actor }),
    });
    await loadRequests();
  }

  const counts = Object.fromEntries(STATUSES.map(({ key }) => [key, requests.filter((item) => item.status === key).length]));
  const openRequest = openId ? requests.find((item) => item.id === openId) : null;

  return (
    <main className="admin-main mastery-requests">
      <div className="mastery-requests-head">
        <div>
          <p className="admin-order-label">Mastery backend queue</p>
          <h2>Requests</h2>
          <p className="muted">Requests are the source of truth. Planning and execution live inside the request card.</p>
        </div>
        {!openRequest && (
          <button type="button" className="admin-primary-button" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Close" : "+ New request"}
          </button>
        )}
      </div>

      {error && <div className="admin-status error">{error}</div>}

      {showForm && !openRequest && (
        <form className="admin-card mastery-request-form" onSubmit={createRequest}>
          <label>
            Request title
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="What should we improve?"
              required
            />
          </label>
          <label>
            Area
            <select value={draft.area} onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))}>
              {REQUEST_AREAS.map((area) => <option value={area} key={area}>{area}</option>)}
            </select>
          </label>
          <label className="mastery-request-description">
            Details
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe the problem, desired outcome, and anything that would help."
              rows="5"
              required
            />
          </label>
          <label>
            Priority
            <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="mastery-request-attachments">
            Attach files <span className="muted">(optional, up to 2 MB each)</span>
            <input
              type="file"
              accept={FILE_ACCEPT}
              multiple
              onChange={(event) => setDraftFiles(Array.from(event.target.files || []).slice(0, 10))}
            />
            {draftFiles.length > 0 && <small>{draftFiles.map((file) => file.name).join(", ")}</small>}
          </label>
          <div className="mastery-request-form-actions">
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="admin-empty"><p>Loading requests...</p></div>
      ) : openRequest ? (
        <RequestDetails
          item={openRequest}
          token={token}
          actor={actor}
          updateRequest={updateRequest}
          deleteRequest={deleteRequest}
          addComment={addComment}
          deleteComment={deleteComment}
          close={() => setOpenId("")}
        />
      ) : (
        <div className="mastery-request-board">
          {STATUSES.map((status) => (
            <section className="mastery-request-column" key={status.key}>
              <header>
                <span>{status.icon} {status.label}</span>
                <strong>{counts[status.key] || 0}</strong>
              </header>
              <div className="mastery-request-column-body">
                {requests.filter((item) => item.status === status.key).map((item) => (
                  <RequestCard key={item.id} item={item} open={() => setOpenId(item.id)} />
                ))}
                {!requests.some((item) => item.status === status.key) && <p className="mastery-request-empty">No requests</p>}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function RequestCard({ item, open }) {
  const status = statusConfig(item.status);
  const planSummary = summarizePlanNotes(item.team_notes);

  return (
    <article className="mastery-request-card">
      <button type="button" className="mastery-request-card-main" onClick={open}>
        <div className="mastery-request-card-meta">
          <span className={`request-priority ${item.priority}`}>{item.priority}</span>
          <span>{status.userLabel}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{planSummary || summarizeText(item.description, 180)}</p>
        <div className="mastery-request-card-foot">
          <small>{item.submitted_by_name} · {timeAgo(item.created_at)}</small>
          <span>{item.area || "Platform"}{(item.attachments || []).length > 0 ? ` · ${item.attachments.length} files` : ""}</span>
        </div>
      </button>
    </article>
  );
}

function RequestDetails({ item, token, actor, updateRequest, deleteRequest, addComment, deleteComment, close }) {
  const [comment, setComment] = useState("");
  const [notes, setNotes] = useState(item.team_notes || "");
  const [selectedPresetId, setSelectedPresetId] = useState(PLANNING_PRESETS[0].id);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copied, setCopied] = useState("");
  const [handoffFallback, setHandoffFallback] = useState("");
  const selectedPreset = PLANNING_PRESETS.find((preset) => preset.id === selectedPresetId) || PLANNING_PRESETS[0];
  const status = statusConfig(item.status);
  const planSummary = summarizePlanNotes(notes);

  async function addAttachments(files) {
    if (!files.length) return;
    setUploading(true);
    setUploadError("");
    try {
      const existing = item.attachments || [];
      if (existing.length + files.length > 10) throw new Error("A request can have up to 10 attachments.");
      const uploaded = await uploadFiles(token, files, item.id);
      await updateRequest(item.id, { attachments: [...existing, ...uploaded] });
    } catch (err) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function copyPayload(payload, label) {
    setHandoffFallback("");
    try {
      await navigator.clipboard?.writeText(payload);
      setCopied(label);
    } catch {
      setCopied("Copy blocked. Select the handoff text below.");
      setHandoffFallback(payload);
    }
    window.setTimeout(() => setCopied(""), 2000);
  }

  async function sendToPlanning() {
    const planningNotes = buildPlanningBrief(item, selectedPreset, actor, notes);
    const payload = buildAlfredoPayload({ ...item, status: "planned" }, planningNotes);
    setNotes(planningNotes);
    await updateRequest(item.id, { status: "planned", team_notes: planningNotes });
    await addComment(item.id, `Planning handoff prepared: ${selectedPreset.label}.`);
    await copyPayload(payload, "Planning handoff copied");
  }

  async function openAttachment(attachment) {
    if (attachment.path) {
      const data = await requestFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({ action: "request-file-url", path: attachment.path }),
      });
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (attachment.url) window.open(attachment.url, "_blank", "noopener,noreferrer");
  }

  async function removeAttachment(attachment) {
    if (!window.confirm(`Remove "${attachment.name}" from this request?`)) return;
    if (attachment.path) {
      await requestFetch(token, "/api/mastery-admin", {
        method: "POST",
        body: JSON.stringify({ action: "delete-request-file", path: attachment.path }),
      });
    }
    await updateRequest(item.id, {
      attachments: (item.attachments || []).filter((entry) => (entry.path || entry.url) !== (attachment.path || attachment.url)),
    });
  }

  return (
    <section className="admin-card mastery-request-detail-view">
      <div className="mastery-request-detail-head">
        <button type="button" className="request-delete-link" onClick={close}>Back to board</button>
        <span className={`mastery-request-status-pill ${item.status}`}>{status.icon} {status.label}</span>
      </div>

      <div className="mastery-request-title-row">
        <div>
          <p className="admin-order-label">{item.area || "Platform"} · {timeAgo(item.created_at)}</p>
          <h3>{item.title}</h3>
          <p className="muted">Submitted by {item.submitted_by_name || "Unknown"}</p>
        </div>
        <span className={`request-priority ${item.priority}`}>{item.priority}</span>
      </div>

      <div className="mastery-request-clean-summary">
        <h4>What this is about</h4>
        <p>{item.description}</p>
      </div>

      {planSummary && (
        <div className="mastery-request-plan-summary">
          <h4>Plan brief</h4>
          <p>{planSummary}</p>
        </div>
      )}

      <div className="mastery-request-detail-grid">
        <label>
          Status
          <select value={item.status} onChange={(event) => updateRequest(item.id, { status: event.target.value })}>
            {STATUSES.map((entry) => <option value={entry.key} key={entry.key}>{entry.label}</option>)}
          </select>
        </label>
        <label>
          Priority
          <select value={item.priority} onChange={(event) => updateRequest(item.id, { priority: event.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Area
          <select value={item.area || "Platform"} onChange={(event) => updateRequest(item.id, { area: event.target.value })}>
            {REQUEST_AREAS.map((area) => <option value={area} key={area}>{area}</option>)}
          </select>
        </label>
      </div>

      <div className="mastery-request-planning-panel">
        <div>
          <h4>Need a plan?</h4>
          <p>Choose the shape, move this request into Planning, and copy the Alfredo handoff. The request stays the source of truth.</p>
        </div>
        <div className="mastery-request-preset-grid" role="radiogroup" aria-label="Planning preset">
          {PLANNING_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className={preset.id === selectedPresetId ? "active" : ""}
              role="radio"
              aria-checked={preset.id === selectedPresetId}
              onClick={() => setSelectedPresetId(preset.id)}
            >
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>
        <div className="mastery-request-panel-actions">
          <button type="button" className="admin-primary-button" onClick={sendToPlanning}>
            Prepare Alfredo handoff
          </button>
          <button type="button" onClick={() => copyPayload(buildAlfredoPayload(item, notes), "Request copied")}>
            Copy handoff
          </button>
          {copied && <span role="status" aria-live="polite">{copied}</span>}
        </div>
        {handoffFallback && (
          <textarea
            className="mastery-request-handoff-fallback"
            value={handoffFallback}
            readOnly
            rows="6"
            aria-label="Alfredo handoff text"
            onFocus={(event) => event.target.select()}
          />
        )}
      </div>

      <label>
        Planning / admin notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="7" placeholder="Optional planning notes, direction, tradeoffs, or implementation context..." />
      </label>
      <div className="mastery-request-panel-actions">
        <button type="button" onClick={() => updateRequest(item.id, { team_notes: notes })}>Save notes</button>
        {item.status !== "in-progress" && <button type="button" onClick={() => updateRequest(item.id, { status: "in-progress", team_notes: notes })}>Move to Doing</button>}
        {item.status !== "done" && <button type="button" onClick={() => updateRequest(item.id, { status: "done", team_notes: notes })}>Mark Done</button>}
      </div>

      <div className="mastery-request-attachment-panel">
        <h4>Attachments</h4>
        {(item.attachments || []).length > 0 ? (
          <div className="mastery-request-attachment-list">
            {item.attachments.map((attachment) => (
              <div className="mastery-request-attachment" key={attachment.path || attachment.url}>
                {String(attachment.type || "").startsWith("image/") && attachment.url && (
                  <button type="button" onClick={() => openAttachment(attachment)}>
                    <img src={attachment.url} alt={attachment.name} loading="lazy" />
                  </button>
                )}
                <button type="button" className="mastery-request-attachment-link" onClick={() => openAttachment(attachment)}>{attachment.name}</button>
                <button
                  type="button"
                  className="request-delete-link"
                  onClick={() => removeAttachment(attachment)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No files attached.</p>
        )}
        <label className="mastery-request-file-button">
          {uploading ? "Uploading..." : "+ Add files"}
          <input
            type="file"
            accept={FILE_ACCEPT}
            multiple
            disabled={uploading}
            onChange={(event) => {
              addAttachments(Array.from(event.target.files || []));
              event.target.value = "";
            }}
          />
        </label>
        {uploadError && <p className="admin-upload-status" role="alert">{uploadError}</p>}
      </div>

      <div className="mastery-request-thread">
        <h4>Discussion</h4>
        {(item.comments || []).map((entry) => (
          <div className="mastery-request-comment" key={entry.id}>
            <div>
              <strong>{entry.author_name}</strong>
              <small>{new Date(entry.created_at).toLocaleString()}</small>
            </div>
            <p>{entry.body}</p>
            {entry.author_id === actor.id && (
              <button type="button" className="request-delete-link" onClick={() => deleteComment(entry.id)}>Delete</button>
            )}
          </div>
        ))}
        <form onSubmit={async (event) => {
          event.preventDefault();
          await addComment(item.id, comment);
          setComment("");
        }}>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="2" placeholder="Reply to the team..." />
          <button type="submit" className="admin-primary-button" disabled={!comment.trim()}>Reply</button>
        </form>
      </div>

      <button type="button" className="request-delete-link" onClick={() => deleteRequest(item)}>Delete request</button>
    </section>
  );
}
