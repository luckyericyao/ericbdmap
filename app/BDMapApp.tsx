"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  companies,
  evidenceLegend,
  intelNotes,
  opportunities,
  structureNodes,
  type EvidenceLevel,
} from "./bd-data";

type View = "map" | "company" | "structure" | "engagement";

type IntelligenceRecord = {
  id: string;
  companyId: string;
  type: "Intelligence" | "Contact" | "Action";
  title: string;
  note: string;
  evidence: EvidenceLevel;
  source: "Official" | "BD Scholar" | "Eric note";
  sourceUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type SyncStatus = "connecting" | "live" | "saving" | "local" | "error";

const navItems: { id: View; label: string; hint: string }[] = [
  { id: "map", label: "Global map", hint: "Portfolio" },
  { id: "company", label: "Company", hint: "Workspace" },
  { id: "structure", label: "Structure", hint: "Decision map" },
  { id: "engagement", label: "Engagement", hint: "Pipeline" },
];

const statusRank = {
  Diligence: 4,
  Engaged: 3,
  Targeting: 2,
  Research: 1,
};

const syncLabels: Record<SyncStatus, string> = {
  connecting: "Connecting",
  live: "Shared workspace",
  saving: "Saving",
  local: "Device draft mode",
  error: "Sync unavailable",
};

function readLocalRecords(): IntelligenceRecord[] {
  const saved = window.localStorage.getItem("eric-bd-map-records");
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as Partial<IntelligenceRecord>[];
    return parsed
      .filter((record) => record.id && record.companyId && record.note)
      .map((record) => ({
        id: String(record.id),
        companyId: String(record.companyId),
        type: record.type ?? "Intelligence",
        title: record.title ?? record.type ?? "Intelligence note",
        note: String(record.note),
        evidence: record.evidence ?? "C",
        source: record.source ?? "Eric note",
        sourceUrl: record.sourceUrl ?? null,
        createdAt: record.createdAt ?? new Date().toISOString(),
        updatedAt: record.updatedAt,
      }));
  } catch {
    window.localStorage.removeItem("eric-bd-map-records");
    return [];
  }
}

function writeLocalRecords(records: IntelligenceRecord[]) {
  window.localStorage.setItem("eric-bd-map-records", JSON.stringify(records));
}

function formatRecordDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  return (
    <span className={`evidence-badge evidence-${level.toLowerCase()}`}>
      {level}
    </span>
  );
}

function CompanyMonogram({
  initials,
  accent,
  large = false,
}: {
  initials: string;
  accent: string;
  large?: boolean;
}) {
  return (
    <span className={`company-monogram accent-${accent}${large ? " is-large" : ""}`}>
      {initials}
    </span>
  );
}

export default function BDMapApp() {
  const [view, setView] = useState<View>("map");
  const [selectedCompanyId, setSelectedCompanyId] = useState("novartis");
  const [search, setSearch] = useState("");
  const [therapy, setTherapy] = useState("All");
  const [mapDepth, setMapDepth] = useState<"Companies" | "Functions" | "People">(
    "Companies",
  );
  const [selectedNode, setSelectedNode] = useState(structureNodes[1]);
  const [zoom, setZoom] = useState(100);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<IntelligenceRecord | null>(null);
  const [records, setRecords] = useState<IntelligenceRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("connecting");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/intelligence", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Shared workspace unavailable");
        return (await response.json()) as { records: IntelligenceRecord[] };
      })
      .then((payload) => {
        if (!cancelled) {
          setRecords(payload.records);
          setSyncStatus("live");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecords(readLocalRecords());
          setSyncStatus("local");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) ?? companies[0];

  const therapyOptions = useMemo(
    () => ["All", "Neuroscience", "Oncology", "Immunology", "Rare disease"],
    [],
  );

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return companies
      .filter((company) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            company.name,
            company.hq,
            ...company.focus,
            ...company.modalities,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);
        const matchesTherapy =
          therapy === "All" || company.focus.includes(therapy);
        return matchesSearch && matchesTherapy;
      })
      .sort((a, b) => b.fit - a.fit);
  }, [search, therapy]);

  const companyIntel =
    selectedCompany.id === "novartis"
      ? intelNotes
      : [
          {
            companyId: selectedCompany.id,
            title: "Company workspace is ready for enrichment",
            body: selectedCompany.summary,
            source: "Eric note" as const,
            level: selectedCompany.evidence,
            date: selectedCompany.verifiedAt,
          },
          {
            companyId: selectedCompany.id,
            title: "Next verification priority",
            body: selectedCompany.nextAction,
            source: "BD Scholar" as const,
            level: "C" as EvidenceLevel,
            date: selectedCompany.verifiedAt,
          },
        ];

  const companyOpportunities = opportunities.filter(
    (opportunity) => opportunity.companyId === selectedCompany.id,
  );
  const companyRecords = records.filter(
    (record) => record.companyId === selectedCompany.id,
  );

  function openCompany(companyId: string, targetView: View = "company") {
    setSelectedCompanyId(companyId);
    setView(targetView);
  }

  function openAddRecord() {
    setEditingRecord(null);
    setIsAdding(true);
  }

  function openEditRecord(record: IntelligenceRecord) {
    setEditingRecord(record);
    setIsAdding(true);
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const note = String(form.get("note") ?? "").trim();
    if (!title || !note) return;

    const payload = {
      id: editingRecord?.id,
      companyId: String(form.get("companyId")),
      type: String(form.get("type")) as IntelligenceRecord["type"],
      title,
      note,
      evidence: String(form.get("evidence")) as EvidenceLevel,
      source: String(form.get("source")) as IntelligenceRecord["source"],
      sourceUrl: String(form.get("sourceUrl") ?? "").trim() || null,
    };

    setSyncStatus("saving");

    try {
      const response = await fetch("/api/intelligence", {
        method: editingRecord ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Unable to save shared record");
      const result = (await response.json()) as {
        record: IntelligenceRecord;
      };
      const savedRecord = editingRecord
        ? { ...editingRecord, ...result.record }
        : result.record;
      setRecords((current) =>
        editingRecord
          ? current.map((record) =>
              record.id === savedRecord.id ? savedRecord : record,
            )
          : [savedRecord, ...current],
      );
      setSyncStatus("live");
      setNotice(editingRecord ? "Shared record updated" : "Shared record saved");
    } catch {
      const fallbackRecord: IntelligenceRecord = {
        ...payload,
        id: editingRecord?.id ?? `record-${Date.now()}`,
        createdAt: editingRecord?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nextRecords = editingRecord
        ? records.map((record) =>
            record.id === fallbackRecord.id ? fallbackRecord : record,
          )
        : [fallbackRecord, ...records];
      setRecords(nextRecords);
      writeLocalRecords(nextRecords);
      setSyncStatus("local");
      setNotice("Saved as a temporary device draft");
    }

    setSelectedCompanyId(payload.companyId);
    setEditingRecord(null);
    setIsAdding(false);
    window.setTimeout(() => setNotice(""), 2800);
  }

  async function deleteRecord(record: IntelligenceRecord) {
    if (!window.confirm(`Delete “${record.title}”? This cannot be undone.`)) {
      return;
    }

    if (syncStatus === "local") {
      const nextRecords = records.filter((item) => item.id !== record.id);
      setRecords(nextRecords);
      writeLocalRecords(nextRecords);
      setNotice("Device draft deleted");
      window.setTimeout(() => setNotice(""), 2800);
      return;
    }

    setSyncStatus("saving");
    try {
      const response = await fetch(
        `/api/intelligence?id=${encodeURIComponent(record.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Unable to delete record");
      setRecords((current) =>
        current.filter((item) => item.id !== record.id),
      );
      setSyncStatus("live");
      setNotice("Shared record deleted");
    } catch {
      setSyncStatus("error");
      setNotice("Could not delete the shared record");
    }
    window.setTimeout(() => setNotice(""), 2800);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setView("map")}
          aria-label="Open Global Map"
        >
          <span className="brand-mark">E</span>
          <span>
            <strong>Eric&apos;s BD Map</strong>
            <small>Partnering intelligence</small>
          </span>
        </button>

        <nav className="primary-nav" aria-label="Primary navigation">
          <p className="nav-label">Explore</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item is-active" : "nav-item"}
              onClick={() => setView(item.id)}
            >
              <span className={`nav-icon nav-icon-${item.id}`} aria-hidden="true" />
              <span>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <section className="coverage-card">
          <div className="coverage-heading">
            <span>Map coverage</span>
            <strong>34%</strong>
          </div>
          <div className="coverage-track">
            <span />
          </div>
          <p>8 companies mapped · 3 verified this month</p>
          <button onClick={() => setView("map")}>View evidence gaps</button>
        </section>

        <div className="user-card">
          <span className="avatar">EY</span>
          <span>
            <strong>Eric Yao</strong>
            <small>Global BD</small>
          </span>
          <span className="online-dot" title="Online" />
        </div>
      </aside>

      <section className="main-stage">
        <header className="topbar">
          <div className="breadcrumb">
            <span>BD intelligence</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{navItems.find((item) => item.id === view)?.label}</strong>
            {view !== "map" && (
              <>
                <span className="breadcrumb-separator">/</span>
                <span>{selectedCompany.shortName}</span>
              </>
            )}
          </div>
          <label className="global-search">
            <span aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setView("map")}
              placeholder="Search company, modality, owner…"
              aria-label="Search company, modality, or owner"
            />
            <kbd>⌘ K</kbd>
          </label>
          <span className={`sync-pill sync-${syncStatus}`}>
            <span aria-hidden="true" />
            {syncLabels[syncStatus]}
          </span>
          <button className="add-button" onClick={openAddRecord}>
            <span>＋</span> Add intelligence
          </button>
        </header>

        {view === "map" && (
          <MapView
            companies={filteredCompanies}
            therapy={therapy}
            therapyOptions={therapyOptions}
            setTherapy={setTherapy}
            mapDepth={mapDepth}
            setMapDepth={setMapDepth}
            openCompany={openCompany}
          />
        )}

        {view === "company" && (
          <CompanyView
            company={selectedCompany}
            notes={companyIntel}
            opportunities={companyOpportunities}
            records={companyRecords}
            onEditRecord={openEditRecord}
            onDeleteRecord={deleteRecord}
            goTo={setView}
          />
        )}

        {view === "structure" && (
          <StructureView
            company={selectedCompany}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            zoom={zoom}
            setZoom={setZoom}
          />
        )}

        {view === "engagement" && (
          <EngagementView
            selectedCompanyId={selectedCompanyId}
            openCompany={openCompany}
          />
        )}
      </section>

      {isAdding && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  {syncStatus === "live" ? "Shared workspace" : "Private workspace"}
                </span>
                <h2 id="add-title">
                  {editingRecord ? "Edit intelligence" : "Add intelligence"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setIsAdding(false);
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={saveRecord} key={editingRecord?.id ?? "new-record"}>
              <div className="form-row">
                <label>
                  Company
                  <select
                    name="companyId"
                    defaultValue={editingRecord?.companyId ?? selectedCompany.id}
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Record type
                  <select
                    name="type"
                    defaultValue={editingRecord?.type ?? "Intelligence"}
                  >
                    <option>Intelligence</option>
                    <option>Contact</option>
                    <option>Action</option>
                  </select>
                </label>
              </div>
              <label>
                Title
                <input
                  name="title"
                  autoFocus
                  defaultValue={editingRecord?.title ?? ""}
                  placeholder="A concise statement of what changed"
                  maxLength={160}
                  required
                />
              </label>
              <label>
                Detail and implication
                <textarea
                  name="note"
                  rows={5}
                  defaultValue={editingRecord?.note ?? ""}
                  placeholder="What changed, what matters, and what should happen next?"
                  maxLength={5000}
                  required
                />
              </label>
              <div className="form-row">
                <label>
                  Evidence confidence
                  <select
                    name="evidence"
                    defaultValue={editingRecord?.evidence ?? "C"}
                  >
                    {evidenceLegend.map((item) => (
                      <option key={item.level} value={item.level}>
                        {item.level} · {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Source layer
                  <select
                    name="source"
                    defaultValue={editingRecord?.source ?? "Eric note"}
                  >
                    <option>Official</option>
                    <option>BD Scholar</option>
                    <option>Eric note</option>
                  </select>
                </label>
              </div>
              <label>
                Source URL · Optional
                <input
                  name="sourceUrl"
                  type="url"
                  defaultValue={editingRecord?.sourceUrl ?? ""}
                  placeholder="https://company.com/partnering/..."
                  maxLength={2000}
                />
              </label>
              <div className="modal-note">
                {syncStatus === "live"
                  ? "This record will be available across your signed-in devices. Evidence and source layers remain visible in the company workspace."
                  : "The shared workspace is not connected right now. Saving will create a temporary draft on this device so the intelligence is not lost."}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingRecord(null);
                    setIsAdding(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={syncStatus === "saving"}
                >
                  {syncStatus === "saving"
                    ? "Saving…"
                    : editingRecord
                      ? "Update record"
                      : "Save record"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}

function MapView({
  companies: visibleCompanies,
  therapy,
  therapyOptions,
  setTherapy,
  mapDepth,
  setMapDepth,
  openCompany,
}: {
  companies: typeof companies;
  therapy: string;
  therapyOptions: string[];
  setTherapy: (value: string) => void;
  mapDepth: "Companies" | "Functions" | "People";
  setMapDepth: (value: "Companies" | "Functions" | "People") => void;
  openCompany: (companyId: string, targetView?: View) => void;
}) {
  const totalOpportunities = visibleCompanies.reduce(
    (sum, company) => sum + company.opportunities,
    0,
  );

  return (
    <div className="page-content">
      <section className="page-heading map-heading">
        <div>
          <span className="eyebrow">Global partnering landscape</span>
          <h1>See the whole board.<br />Move on the right door.</h1>
          <p>
            One living map of MNC priorities, decision structure, relationship
            strength and the next action that advances a deal.
          </p>
        </div>
        <div className="map-stat-strip">
          <div>
            <strong>{visibleCompanies.length}</strong>
            <span>MNCs visible</span>
          </div>
          <div>
            <strong>{totalOpportunities}</strong>
            <span>Open routes</span>
          </div>
          <div>
            <strong>3</strong>
            <span>Need action</span>
          </div>
        </div>
      </section>

      <section className="map-toolbar">
        <div className="filter-group">
          {therapyOptions.map((option) => (
            <button
              key={option}
              className={therapy === option ? "filter-chip is-active" : "filter-chip"}
              onClick={() => setTherapy(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="depth-control" aria-label="Map detail level">
          <span>Map depth</span>
          {(["Companies", "Functions", "People"] as const).map((depth) => (
            <button
              key={depth}
              className={mapDepth === depth ? "is-active" : ""}
              onClick={() => setMapDepth(depth)}
            >
              {depth}
            </button>
          ))}
        </div>
      </section>

      <section className={`company-map depth-${mapDepth.toLowerCase()}`}>
        <div className="map-grid" aria-hidden="true" />
        <div className="map-axis map-axis-y">
          <span>Strategic fit</span>
        </div>
        <div className="map-axis map-axis-x">
          <span>Relationship strength →</span>
        </div>
        <div className="map-region-label region-label-eu">Europe</div>
        <div className="map-region-label region-label-na">North America</div>
        <div className="company-card-grid">
          {visibleCompanies.map((company, index) => (
            <button
              key={company.id}
              className={`company-map-card map-card-${index + 1}`}
              onClick={() => openCompany(company.id)}
              style={{ "--fit": company.fit } as React.CSSProperties}
            >
              <div className="company-card-top">
                <CompanyMonogram
                  initials={company.initials}
                  accent={company.accent}
                />
                <span className={`relationship-pill relation-${company.relationship.toLowerCase()}`}>
                  {company.relationship}
                </span>
              </div>
              <strong>{company.shortName}</strong>
              <small>{company.hq}</small>
              <div className="company-card-detail">
                <span>{company.focus[0]}</span>
                <span>{company.modalities[0]}</span>
              </div>
              {mapDepth === "People" && (
                <div className="company-people">
                  <span>Owner</span>
                  <strong>{company.owner}</strong>
                  <span>{company.opportunities} active routes</span>
                </div>
              )}
              <div className="fit-line">
                <span style={{ width: `${company.fit}%` }} />
              </div>
            </button>
          ))}
        </div>
        {visibleCompanies.length === 0 && (
          <div className="empty-state">
            <span>○</span>
            <h3>No companies match this lens</h3>
            <p>Clear the search or choose another therapeutic area.</p>
          </div>
        )}
      </section>

      <section className="map-footer">
        <div className="legend-block">
          <strong>Evidence confidence</strong>
          {evidenceLegend.map((item) => (
            <span key={item.level}>
              <EvidenceBadge level={item.level} />
              {item.label}
            </span>
          ))}
        </div>
        <div className="map-callout">
          <span className="callout-mark">↗</span>
          <div>
            <strong>Highest-leverage move</strong>
            <p>
              AstraZeneca has the strongest combination of fit, active routes
              and a near-term action.
            </p>
          </div>
          <button onClick={() => openCompany("astrazeneca")}>Open workspace</button>
        </div>
      </section>
    </div>
  );
}

function CompanyView({
  company,
  notes,
  opportunities: companyOpportunities,
  records,
  onEditRecord,
  onDeleteRecord,
  goTo,
}: {
  company: (typeof companies)[number];
  notes: typeof intelNotes;
  opportunities: typeof opportunities;
  records: IntelligenceRecord[];
  onEditRecord: (record: IntelligenceRecord) => void;
  onDeleteRecord: (record: IntelligenceRecord) => void;
  goTo: (view: View) => void;
}) {
  return (
    <div className="page-content company-page">
      <section className="company-hero">
        <div className="company-title">
          <CompanyMonogram
            initials={company.initials}
            accent={company.accent}
            large
          />
          <div>
            <span className="eyebrow">Company workspace · {company.hq}</span>
            <h1>{company.name}</h1>
            <p>{company.summary}</p>
          </div>
        </div>
        <div className="company-hero-actions">
          <span className={`relationship-pill relation-${company.relationship.toLowerCase()}`}>
            {company.relationship} relationship
          </span>
          <button className="secondary-button" onClick={() => goTo("structure")}>
            Open structure →
          </button>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card strategic-fit">
          <span>Strategic fit</span>
          <div className="metric-number">
            <strong>{company.fit}</strong>
            <small>/100</small>
          </div>
          <div className="radial-score" style={{ "--score": company.fit } as React.CSSProperties}>
            <span />
          </div>
          <p>High overlap with priority capabilities</p>
        </article>
        <article className="metric-card">
          <span>Active routes</span>
          <strong className="large-metric">{company.opportunities}</strong>
          <p>{companyOpportunities.length} opportunities currently detailed</p>
          <button onClick={() => goTo("engagement")}>View pipeline →</button>
        </article>
        <article className="metric-card">
          <span>Next action</span>
          <strong className="next-action">{company.nextAction}</strong>
          <div className="due-line">
            <span>Due {company.nextActionDate}</span>
            <span>Owner · {company.owner}</span>
          </div>
        </article>
        <article className="metric-card confidence-card">
          <span>Evidence confidence</span>
          <div className="confidence-value">
            <EvidenceBadge level={company.evidence} />
            <strong>
              {evidenceLegend.find((item) => item.level === company.evidence)?.label}
            </strong>
          </div>
          <p>Last verified {company.verifiedAt}</p>
          <button>Review sources →</button>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="workspace-main">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Decision-grade context</span>
              <h2>What matters now</h2>
            </div>
            <button className="text-button">View all intelligence</button>
          </div>
          <div className="intel-list">
            {notes.map((note) => (
              <article className="intel-card" key={note.title}>
                <div className="intel-card-line">
                  <span className={`source-tag source-${note.source.toLowerCase().replace(" ", "-")}`}>
                    {note.source}
                  </span>
                  <span>{note.date}</span>
                  <EvidenceBadge level={note.level} />
                </div>
                <h3>{note.title}</h3>
                <p>{note.body}</p>
              </article>
            ))}
            {records.map((record) => (
              <article className="intel-card is-private" key={record.id}>
                <div className="intel-card-line">
                  <span
                    className={`source-tag source-${record.source.toLowerCase().replace(" ", "-")}`}
                  >
                    {record.source}
                  </span>
                  <span>{formatRecordDate(record.updatedAt ?? record.createdAt)}</span>
                  <EvidenceBadge level={record.evidence} />
                </div>
                <div className="intel-card-heading">
                  <div>
                    <span>{record.type}</span>
                    <h3>{record.title}</h3>
                  </div>
                  <div className="record-actions">
                    <button onClick={() => onEditRecord(record)}>Edit</button>
                    <button
                      className="delete-record"
                      onClick={() => onDeleteRecord(record)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p>{record.note}</p>
                {record.sourceUrl && (
                  <a
                    className="record-source-link"
                    href={record.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="workspace-side">
          <section className="focus-panel">
            <div className="section-heading compact">
              <h2>Strategic focus</h2>
              <span>Current thesis</span>
            </div>
            <div className="focus-group">
              <span>Therapeutic areas</span>
              <div>
                {company.focus.map((item) => (
                  <button key={item}>{item}</button>
                ))}
              </div>
            </div>
            <div className="focus-group">
              <span>Modalities & platforms</span>
              <div>
                {company.modalities.map((item) => (
                  <button key={item}>{item}</button>
                ))}
              </div>
            </div>
          </section>

          <section className="route-panel">
            <div className="section-heading compact">
              <h2>Recommended route</h2>
              <span>Map hypothesis</span>
            </div>
            <div className="route-step is-complete">
              <span>01</span>
              <div>
                <strong>Scientific sponsor</strong>
                <small>Validate the problem and wedge</small>
              </div>
            </div>
            <div className="route-step is-current">
              <span>02</span>
              <div>
                <strong>Search & Evaluation</strong>
                <small>Shape fit and internal ownership</small>
              </div>
            </div>
            <div className="route-step">
              <span>03</span>
              <div>
                <strong>Transactions</strong>
                <small>Structure only after sponsorship</small>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function StructureView({
  company,
  selectedNode,
  setSelectedNode,
  zoom,
  setZoom,
}: {
  company: (typeof companies)[number];
  selectedNode: (typeof structureNodes)[number];
  setSelectedNode: (node: (typeof structureNodes)[number]) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}) {
  return (
    <div className="structure-layout">
      <div className="structure-main">
        <section className="structure-header">
          <div>
            <span className="eyebrow">{company.name} · Decision system</span>
            <h1>Structure is a route, not a directory.</h1>
            <p>
              Read from sponsorship to evaluation, transaction and execution.
              Dashed relationships are hypotheses that still need confirmation.
            </p>
          </div>
          <div className="structure-controls">
            <button onClick={() => setZoom(Math.max(80, zoom - 10))}>−</button>
            <span>{zoom}%</span>
            <button onClick={() => setZoom(Math.min(120, zoom + 10))}>＋</button>
            <button className="fit-button" onClick={() => setZoom(100)}>
              Fit
            </button>
          </div>
        </section>

        <section className="structure-canvas">
          <div className="canvas-grid" aria-hidden="true" />
          <div
            className="org-chart"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <button
              className={`org-node org-top ${selectedNode.id === structureNodes[0].id ? "is-selected" : ""}`}
              onClick={() => setSelectedNode(structureNodes[0])}
            >
              <span className="node-kicker">Enterprise</span>
              <strong>{structureNodes[0].role}</strong>
              <small>{structureNodes[0].scope}</small>
              <EvidenceBadge level={structureNodes[0].level} />
            </button>
            <span className="connector connector-vertical top-connector" />
            <button
              className={`org-node org-core ${selectedNode.id === structureNodes[1].id ? "is-selected" : ""}`}
              onClick={() => setSelectedNode(structureNodes[1])}
            >
              <span className="node-kicker">Global function</span>
              <strong>{structureNodes[1].role}</strong>
              <small>{structureNodes[1].scope}</small>
              <EvidenceBadge level={structureNodes[1].level} />
            </button>
            <span className="connector connector-vertical core-connector" />
            <span className="connector connector-horizontal branch-connector" />
            <div className="org-branches">
              {structureNodes.slice(2).map((node) => (
                <div className="branch-wrap" key={node.id}>
                  <span
                    className={`connector connector-vertical branch-line ${node.level === "C" ? "is-dashed" : ""}`}
                  />
                  <button
                    className={`org-node org-branch ${selectedNode.id === node.id ? "is-selected" : ""} ${node.level === "C" ? "is-hypothesis" : ""}`}
                    onClick={() => setSelectedNode(node)}
                  >
                    <span className="node-kicker">
                      {node.id === "se" ? "Scientific ownership" : "Partnering function"}
                    </span>
                    <strong>{node.role}</strong>
                    <small>{node.scope}</small>
                    <EvidenceBadge level={node.level} />
                  </button>
                  {node.id === "se" && (
                    <div className="person-stack">
                      <span className="mini-person">Therapy lead</span>
                      <span className="mini-person">Modality lead</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="canvas-caption">
            <span className="solid-line" /> Confirmed reporting relationship
            <span className="dashed-line" /> Working hypothesis
          </div>
        </section>
      </div>

      <aside className="node-drawer">
        <div className="drawer-heading">
          <span className="eyebrow">Selected function</span>
          <EvidenceBadge level={selectedNode.level} />
        </div>
        <h2>{selectedNode.role}</h2>
        <p>{selectedNode.scope}</p>
        <div className="drawer-section">
          <span>Role in the deal</span>
          <strong>
            {selectedNode.id === "se"
              ? "Builds the internal scientific case and finds the right champion."
              : selectedNode.id === "transactions"
                ? "Turns sponsored interest into executable deal structure."
                : "Connects this step to the broader partnering decision."}
          </strong>
        </div>
        <div className="drawer-section">
          <span>Evidence status</span>
          <div className="drawer-evidence">
            <EvidenceBadge level={selectedNode.level} />
            <div>
              <strong>{selectedNode.status}</strong>
              <small>Reviewed {company.verifiedAt}</small>
            </div>
          </div>
        </div>
        <div className="drawer-section">
          <span>Known people</span>
          <div className="empty-people">
            <div className="empty-person-mark">＋</div>
            <p>No verified person attached yet.</p>
            <button>Add a person</button>
          </div>
        </div>
        <div className="drawer-section">
          <span>Eric&apos;s action</span>
          <strong>{company.nextAction}</strong>
          <small>Owner · {company.owner} · Due {company.nextActionDate}</small>
        </div>
      </aside>
    </div>
  );
}

function EngagementView({
  selectedCompanyId,
  openCompany,
}: {
  selectedCompanyId: string;
  openCompany: (companyId: string, targetView?: View) => void;
}) {
  const orderedOpportunities = [...opportunities].sort(
    (a, b) => statusRank[b.stage] - statusRank[a.stage],
  );

  return (
    <div className="page-content engagement-page">
      <section className="page-heading engagement-heading">
        <div>
          <span className="eyebrow">From intelligence to motion</span>
          <h1>Every mapped relationship needs a next move.</h1>
          <p>
            Track active opportunities by stage, owner and the specific action
            that keeps momentum alive.
          </p>
        </div>
        <div className="pipeline-summary">
          {(["Research", "Targeting", "Engaged", "Diligence"] as const).map(
            (stage) => (
              <div key={stage}>
                <span className={`stage-dot stage-${stage.toLowerCase()}`} />
                <strong>
                  {opportunities.filter((opportunity) => opportunity.stage === stage).length}
                </strong>
                <small>{stage}</small>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="pipeline-table">
        <div className="pipeline-table-head">
          <span>Company / opportunity</span>
          <span>Modality</span>
          <span>Stage</span>
          <span>Owner</span>
          <span>Next action</span>
          <span>Due</span>
        </div>
        {orderedOpportunities.map((opportunity) => {
          const company = companies.find(
            (item) => item.id === opportunity.companyId,
          )!;
          return (
            <button
              className={`pipeline-row ${selectedCompanyId === company.id ? "is-related" : ""}`}
              key={opportunity.id}
              onClick={() => openCompany(company.id, "company")}
            >
              <span className="pipeline-company">
                <CompanyMonogram
                  initials={company.initials}
                  accent={company.accent}
                />
                <span>
                  <strong>{opportunity.project}</strong>
                  <small>{company.shortName}</small>
                </span>
              </span>
              <span className="table-tag">{opportunity.modality}</span>
              <span className={`stage-badge stage-${opportunity.stage.toLowerCase()}`}>
                {opportunity.stage}
              </span>
              <span className="owner-cell">
                <span className="mini-avatar">EY</span>
                {opportunity.owner}
              </span>
              <span>{opportunity.next}</span>
              <span className="due-cell">{opportunity.date}</span>
            </button>
          );
        })}
      </section>

      <section className="engagement-bottom">
        <div className="attention-panel">
          <div className="section-heading compact">
            <h2>Needs attention</h2>
            <span>Next 14 days</span>
          </div>
          {orderedOpportunities.slice(0, 3).map((opportunity, index) => (
            <div className="attention-item" key={opportunity.id}>
              <span className="attention-index">0{index + 1}</span>
              <div>
                <strong>{opportunity.next}</strong>
                <small>
                  {companies.find((company) => company.id === opportunity.companyId)?.shortName}
                  {" · "}
                  {opportunity.project}
                </small>
              </div>
              <span>{opportunity.date}</span>
            </div>
          ))}
        </div>
        <div className="principle-panel">
          <span className="eyebrow">Operating principle</span>
          <blockquote>
            “Structure tells us who may matter. Engagement tells us what to do
            next.”
          </blockquote>
          <p>Keep every company workspace tied to an owner, a date and a decision.</p>
        </div>
      </section>
    </div>
  );
}
