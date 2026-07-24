import { useCallback, useEffect, useMemo, useState } from "react";

const STATUSES = [
  { key: "new", label: "New", icon: "✨" },
  { key: "planned", label: "Planned", icon: "📌" },
  { key: "in-progress", label: "In progress", icon: "🛠️" },
  { key: "done", label: "Done", icon: "✅" },
];

const MAX_FILE_BYTES = 3 * 1024 * 1024;
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
    if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 3 MB.`);
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
      setDraft({ title: "", description: "", priority: "medium" });
      setDraftFiles([]);
      setShowForm(false);
      await loadRequests();
    } catch (err) {
      setError(err.message);
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
    }
  }

  async function deleteRequest(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
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

  return (
    <main className="admin-main mastery-requests">
      <div className="mastery-requests-head">
        <div>
          <p className="admin-order-label">Team improvement board</p>
          <h2>Requests</h2>
          <p className="muted">Share ideas, bugs, and improvements that will make the Mastery platform better.</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "+ New request"}
        </button>
      </div>

      {error && <div className="admin-status error">{error}</div>}

      {showForm && (
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
          <label className="mastery-request-description">
            Details
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe the problem, desired outcome, and anything that would help the team understand it."
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
            Attach files <span className="muted">(optional, up to 3 MB each)</span>
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
              {saving ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="admin-empty"><p>Loading requests…</p></div>
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
                  <article className={`mastery-request-card ${openId === item.id ? "open" : ""}`} key={item.id}>
                    <button type="button" className="mastery-request-card-main" onClick={() => setOpenId(openId === item.id ? "" : item.id)}>
                      <div className="mastery-request-card-meta">
                        <span className={`request-priority ${item.priority}`}>{item.priority}</span>
                        {(item.attachments || []).length > 0 && <span>📎 {item.attachments.length}</span>}
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <small>{item.submitted_by_name} · {new Date(item.created_at).toLocaleDateString()}</small>
                    </button>
                    {openId === item.id && (
                      <RequestDetails
                        item={item}
                        token={token}
                        actor={actor}
                        updateRequest={updateRequest}
                        deleteRequest={deleteRequest}
                        addComment={addComment}
                        deleteComment={deleteComment}
                      />
                    )}
                  </article>
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

function RequestDetails({ item, token, actor, updateRequest, deleteRequest, addComment, deleteComment }) {
  const [comment, setComment] = useState("");
  const [notes, setNotes] = useState(item.team_notes || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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

  return (
    <div className="mastery-request-details">
      <div className="mastery-request-detail-grid">
        <label>
          Status
          <select value={item.status} onChange={(event) => updateRequest(item.id, { status: event.target.value })}>
            {STATUSES.map((status) => <option value={status.key} key={status.key}>{status.label}</option>)}
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
      </div>
      <label>
        Team notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" placeholder="Decision, owner, next step…" />
      </label>
      <button type="button" onClick={() => updateRequest(item.id, { team_notes: notes })}>Save notes</button>

      <div className="mastery-request-attachment-panel">
        <h4>Attachments</h4>
        {(item.attachments || []).length > 0 && (
          <div className="mastery-request-attachment-list">
            {item.attachments.map((attachment) => (
              <div className="mastery-request-attachment" key={attachment.path || attachment.url}>
                {String(attachment.type || "").startsWith("image/") && (
                  <a href={attachment.url} target="_blank" rel="noreferrer">
                    <img src={attachment.url} alt={attachment.name} loading="lazy" />
                  </a>
                )}
                <a href={attachment.url} target="_blank" rel="noreferrer">{attachment.name}</a>
                <button
                  type="button"
                  className="request-delete-link"
                  onClick={() => updateRequest(item.id, {
                    attachments: (item.attachments || []).filter((entry) => entry.url !== attachment.url),
                  })}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="mastery-request-file-button">
          {uploading ? "Uploading…" : "+ Add files"}
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
        {uploadError && <p className="admin-upload-status">{uploadError}</p>}
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
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="2" placeholder="Reply to the team…" />
          <button type="submit" disabled={!comment.trim()}>Reply</button>
        </form>
      </div>

      {item.submitted_by === actor.id && (
        <button type="button" className="request-delete-link" onClick={() => deleteRequest(item)}>Delete my request</button>
      )}
    </div>
  );
}
