"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  companies,
  evidenceLegend,
  intelNotes,
  opportunities,
  type EvidenceLevel,
} from "./bd-data";
import { companyPeopleStructures } from "./structure-data";

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

type StructureVersionRecord = {
  id: string;
  companyId: string;
  versionLabel: string;
  sourceTitle: string;
  sourceUrl: string | null;
  articleDate: string | null;
  originalFilename: string;
  originalMimeType: string;
  status: "Original captured" | "Replica in progress" | "Verified snapshot";
  evidence: EvidenceLevel;
  notes: string | null;
  createdAt: string;
  verifiedAt: string | null;
  nodeCount: number;
  edgeCount: number;
  imageUrl: string;
};

type StructureMode = "original" | "interactive" | "validation";

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

  function openCompany(companyId: string, targetView: View = "structure") {
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
            <span>Named people</span>
            <strong>76</strong>
          </div>
          <div className="coverage-track">
            <span />
          </div>
          <p>8 companies · sourced roles and qualified links</p>
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
            key={selectedCompany.id}
            company={selectedCompany}
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
                  <span>Named structure</span>
                  <strong>
                    {companyPeopleStructures[company.id]?.nodes.length ?? 0}{" "}
                    people
                  </strong>
                  <span>
                    {companyPeopleStructures[company.id]?.nodes.filter(
                      (node) => node.relationshipConfirmed,
                    ).length ?? 0}{" "}
                    confirmed links
                  </span>
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
  zoom,
  setZoom,
}: {
  company: (typeof companies)[number];
  zoom: number;
  setZoom: (zoom: number) => void;
}) {
  const peopleStructure = companyPeopleStructures[company.id];
  const peopleNodes = peopleStructure?.nodes ?? [];
  const initialPeopleNode =
    peopleNodes.find((node) =>
      /Global Head|Senior Vice President|Head of Corporate|Head of Business/.test(
        node.role,
      ),
    ) ?? peopleNodes[0];
  const [selectedPeopleNodeId, setSelectedPeopleNodeId] = useState(
    initialPeopleNode?.id ?? "",
  );
  const [mode, setMode] = useState<StructureMode>("interactive");
  const [versions, setVersions] = useState<StructureVersionRecord[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [archiveStatus, setArchiveStatus] = useState<
    "loading" | "live" | "missing" | "error"
  >("loading");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [archiveNotice, setArchiveNotice] = useState("");
  const referencedInPriorTracker = ["novartis", "amgen", "sanofi"].includes(
    company.id,
  );
  const selectedPeopleNode =
    peopleNodes.find((node) => node.id === selectedPeopleNodeId) ??
    initialPeopleNode;
  const selectedParent = selectedPeopleNode?.parentId
    ? peopleNodes.find((node) => node.id === selectedPeopleNode.parentId)
    : undefined;
  const peopleGroups = Array.from(
    new Set(peopleNodes.map((node) => node.group)),
  );
  const confirmedRelationshipCount = peopleNodes.filter(
    (node) => node.relationshipConfirmed,
  ).length;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/structures?companyId=${encodeURIComponent(company.id)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Archive unavailable");
        return (await response.json()) as {
          versions: StructureVersionRecord[];
        };
      })
      .then((payload) => {
        if (!cancelled) {
          setVersions(payload.versions);
          setSelectedVersionId(payload.versions[0]?.id ?? "");
          setArchiveStatus(payload.versions.length ? "live" : "missing");
        }
      })
      .catch(() => {
        if (!cancelled) setArchiveStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [company.id]);

  const activeVersion =
    versions.find((version) => version.id === selectedVersionId) ?? versions[0];

  async function uploadOriginal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setArchiveNotice("");
    const form = new FormData(event.currentTarget);
    form.set("companyId", company.id);

    try {
      const response = await fetch("/api/structure-assets", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as {
        version?: StructureVersionRecord;
        error?: string;
      };
      if (!response.ok || !result.version) {
        throw new Error(result.error ?? "Upload failed");
      }
      setVersions((current) => [result.version!, ...current]);
      setSelectedVersionId(result.version.id);
      setArchiveStatus("live");
      setShowUpload(false);
      setArchiveNotice("Original diagram archived as a new immutable version.");
      event.currentTarget.reset();
    } catch (error) {
      setArchiveNotice(
        error instanceof Error
          ? error.message
          : "The original diagram could not be archived.",
      );
    } finally {
      setUploading(false);
    }
  }

  const structureModes: {
    id: StructureMode;
    label: string;
    hint: string;
  }[] = [
    { id: "original", label: "Original diagram", hint: "Source of truth" },
    {
      id: "interactive",
      label: "People structure",
      hint: "Named owners & reporting lines",
    },
    { id: "validation", label: "Source validation", hint: "Claim by claim" },
  ];

  return (
    <div className="structure-layout">
      <div className="structure-main">
        <section className="structure-header">
          <div>
            <span className="eyebrow">{company.name} · Structure archive</span>
            <h1>People, ownership and reporting lines.</h1>
            <p>
              The original diagram remains preserved separately. This working
              map names the real decision owners, shows what relationship is
              confirmed, and labels every inferred connection.
            </p>
          </div>
          {mode === "interactive" && (
            <div className="structure-controls">
              <button onClick={() => setZoom(Math.max(80, zoom - 10))}>−</button>
              <span>{zoom}%</span>
              <button onClick={() => setZoom(Math.min(120, zoom + 10))}>＋</button>
              <button className="fit-button" onClick={() => setZoom(100)}>
                Fit
              </button>
            </div>
          )}
        </section>

        <section className="structure-mode-tabs" aria-label="Structure layers">
          {structureModes.map((item, index) => (
            <button
              key={item.id}
              className={mode === item.id ? "is-active" : ""}
              onClick={() => setMode(item.id)}
            >
              <span>0{index + 1}</span>
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </button>
          ))}
        </section>

        {mode === "original" && (
          <section className="original-archive">
            {activeVersion ? (
              <>
                <div className="original-meta-bar">
                  <div>
                    <span className="archive-status archive-complete">
                      Original captured
                    </span>
                    <strong>{activeVersion.versionLabel}</strong>
                    <small>{activeVersion.sourceTitle}</small>
                  </div>
                  <div>
                    <EvidenceBadge level={activeVersion.evidence} />
                    <button
                      className="secondary-button"
                      onClick={() => setShowUpload((current) => !current)}
                    >
                      Add newer version
                    </button>
                  </div>
                </div>
                <div className="original-image-stage">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeVersion.imageUrl}
                    alt={`${company.name} original BD organization diagram — ${activeVersion.versionLabel}`}
                  />
                </div>
                <div className="original-source-line">
                  <div>
                    <span>Article date</span>
                    <strong>{activeVersion.articleDate ?? "Not recorded"}</strong>
                  </div>
                  <div>
                    <span>Original file</span>
                    <strong>{activeVersion.originalFilename}</strong>
                  </div>
                  <div>
                    <span>Captured</span>
                    <strong>{formatRecordDate(activeVersion.createdAt)}</strong>
                  </div>
                  {activeVersion.sourceUrl ? (
                    <a
                      href={activeVersion.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open article ↗
                    </a>
                  ) : (
                    <span className="source-link-missing">Article URL missing</span>
                  )}
                </div>
              </>
            ) : (
              <div className="original-missing-state">
                <span className="missing-diagram-mark">□</span>
                <span className="archive-status archive-missing">
                  Original file missing
                </span>
                <h2>Do not promote the reconstruction as the source.</h2>
                <p>
                  {archiveStatus === "loading"
                    ? "Checking the permanent structure archive…"
                    : referencedInPriorTracker
                      ? "A complete original was referenced in the earlier tracker, but the image file is not present in this website archive. Transfer it here before marking this company as captured."
                      : "The original BD Scholar diagram has not been recovered. The interactive view remains a clearly labeled working hypothesis until this source is uploaded."}
                </p>
                <button
                  className="primary-button"
                  onClick={() => setShowUpload(true)}
                >
                  Archive original diagram
                </button>
              </div>
            )}

            {(showUpload || (!activeVersion && archiveStatus !== "loading")) && (
              <form className="structure-upload-form" onSubmit={uploadOriginal}>
                <div className="upload-form-heading">
                  <div>
                    <span className="eyebrow">Permanent source capture</span>
                    <h2>Archive an original version</h2>
                  </div>
                  {activeVersion && (
                    <button
                      type="button"
                      onClick={() => setShowUpload(false)}
                      aria-label="Close upload form"
                    >
                      ×
                    </button>
                  )}
                </div>
                <input type="hidden" name="companyId" value={company.id} />
                <label className="diagram-dropzone">
                  <span className="dropzone-mark">＋</span>
                  <strong>Choose the complete, uncropped diagram</strong>
                  <small>PNG, JPEG or WebP · up to 15 MB</small>
                  <input
                    type="file"
                    name="file"
                    accept="image/png,image/jpeg,image/webp"
                    required
                  />
                </label>
                <div className="form-row">
                  <label>
                    Version label
                    <input
                      name="versionLabel"
                      placeholder="BD Scholar · 2026-05"
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    Article date
                    <input name="articleDate" type="date" />
                  </label>
                </div>
                <label>
                  Source title
                  <input
                    name="sourceTitle"
                    placeholder={`${company.name} BD organization analysis`}
                    maxLength={180}
                    required
                  />
                </label>
                <label>
                  Article URL · Optional
                  <input
                    name="sourceUrl"
                    type="url"
                    placeholder="https://mp.weixin.qq.com/s/..."
                    maxLength={2000}
                  />
                </label>
                <label>
                  Capture notes · Optional
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="What is complete, cropped, unclear, or still needs verification?"
                    maxLength={2000}
                  />
                </label>
                {archiveNotice && (
                  <div className="archive-notice">{archiveNotice}</div>
                )}
                <div className="modal-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={uploading}
                  >
                    {uploading ? "Archiving…" : "Archive immutable version"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {mode === "interactive" && (
          <>
            <div className="replica-status replica-people-live">
              <strong>
                {peopleNodes.length} named owners ·{" "}
                {confirmedRelationshipCount} confirmed ownership or reporting
                links
              </strong>
              <span>
                {activeVersion
                  ? "Current people data is shown below; the exact BD Scholar layout remains a separate transcription task."
                  : "Current official sources are mapped below. The missing original BD Scholar image is still clearly marked in layer 01."}
              </span>
            </div>
            <section className="structure-canvas people-structure-canvas">
              <div className="canvas-grid" aria-hidden="true" />
              <div
                className="people-org-chart"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <div className="people-map-intro">
                  <div>
                    <span className="eyebrow">Current people map</span>
                    <h2>{company.name} decision structure</h2>
                  </div>
                  <div>
                    <span>Verified</span>
                    <strong>{peopleStructure?.asOf ?? company.verifiedAt}</strong>
                  </div>
                  <a
                    href={peopleStructure?.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Primary team source ↗
                  </a>
                </div>
                <p className="people-map-summary">
                  {peopleStructure?.summary ??
                    "No named structure has been recovered for this company yet."}
                </p>
                <div className="people-function-groups">
                  {peopleGroups.map((group) => {
                    const groupNodes = peopleNodes.filter(
                      (node) => node.group === group,
                    );
                    return (
                      <section className="people-function-group" key={group}>
                        <div className="people-group-heading">
                          <span>{group}</span>
                          <strong>{groupNodes.length}</strong>
                        </div>
                        <div className="people-node-grid">
                          {groupNodes.map((node) => {
                            const parent = node.parentId
                              ? peopleNodes.find(
                                  (candidate) => candidate.id === node.parentId,
                                )
                              : undefined;
                            return (
                              <button
                                className={`people-node ${selectedPeopleNode?.id === node.id ? "is-selected" : ""}`}
                                key={node.id}
                                onClick={() => setSelectedPeopleNodeId(node.id)}
                              >
                                <span
                                  className={
                                    node.relationshipConfirmed
                                      ? "people-relation-line"
                                      : "people-relation-line is-dashed"
                                  }
                                  aria-hidden="true"
                                />
                                <span className="people-node-topline">
                                  <span>{node.location ?? "Global"}</span>
                                  <EvidenceBadge level={node.evidence} />
                                </span>
                                <strong>{node.name}</strong>
                                <small>{node.role}</small>
                                <span className="people-node-relation">
                                  {parent
                                    ? `${node.relationship} · ${parent.name}`
                                    : node.relationship}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
              <div className="canvas-caption">
                <span className="solid-line" /> Confirmed role, ownership or
                reporting line
                <span className="dashed-line" /> Same team or functional
                relationship; direct report not stated
              </div>
            </section>
          </>
        )}

        {mode === "validation" && (
          <section className="validation-workspace">
            <div className="validation-summary-grid">
              <article className={activeVersion ? "is-complete" : "is-missing"}>
                <span>01 · Original source</span>
                <strong>
                  {activeVersion ? "Permanent file captured" : "Source file missing"}
                </strong>
                <p>
                  {activeVersion
                    ? `${activeVersion.versionLabel} · ${activeVersion.sourceTitle}`
                    : "No original image can currently be used to check the reconstruction."}
                </p>
              </article>
              <article
                className={peopleNodes.length ? "is-complete" : "is-incomplete"}
              >
                <span>02 · Named people structure</span>
                <strong>
                  {peopleNodes.length
                    ? `${peopleNodes.length} people and owners mapped`
                    : "People capture pending"}
                </strong>
                <p>
                  Solid relationships are explicitly supported. Team membership
                  without a published direct report remains dashed.
                </p>
              </article>
              <article className={peopleNodes.length ? "is-complete" : "is-incomplete"}>
                <span>03 · Current validation</span>
                <strong>
                  {peopleStructure
                    ? `Reviewed ${peopleStructure.asOf}`
                    : "Current-state review pending"}
                </strong>
                <p>
                  Each person carries a role source, evidence grade and
                  relationship qualification.
                </p>
              </article>
            </div>
            <div className="validation-table">
              <div className="validation-table-head">
                <span>Person / function</span>
                <span>Relationship</span>
                <span>Current status</span>
                <span>Evidence</span>
              </div>
              {peopleNodes.map((node) => (
                <div className="validation-row" key={node.id}>
                  <strong>
                    {node.name}
                    <small>{node.role}</small>
                  </strong>
                  <span>{node.relationship}</span>
                  <span
                    className={
                      !node.relationshipConfirmed
                        ? "validation-status is-unverified"
                        : "validation-status"
                    }
                  >
                    {node.status}
                  </span>
                  <EvidenceBadge level={node.evidence} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="node-drawer">
        {mode === "original" && (
          <>
            <div className="drawer-heading">
              <span className="eyebrow">Version archive</span>
              <span className="archive-count">{versions.length}</span>
            </div>
            <h2>Original history</h2>
            <p>
              Every upload creates a new source version. Earlier diagrams remain
              available for historical comparison.
            </p>
            <div className="version-list">
              {versions.map((version) => (
                <button
                  key={version.id}
                  className={
                    activeVersion?.id === version.id ? "is-selected" : ""
                  }
                  onClick={() => setSelectedVersionId(version.id)}
                >
                  <EvidenceBadge level={version.evidence} />
                  <span>
                    <strong>{version.versionLabel}</strong>
                    <small>{version.sourceTitle}</small>
                  </span>
                  <span>{formatRecordDate(version.createdAt)}</span>
                </button>
              ))}
              {!versions.length && (
                <div className="version-empty">
                  <strong>No original versions archived</strong>
                  <p>The gap is explicit and searchable.</p>
                </div>
              )}
            </div>
            <div className="drawer-section">
              <span>Capture standard</span>
              <strong>Complete, uncropped and linked to the article.</strong>
              <small>
                Never replace the author&apos;s diagram with a simplified
                reconstruction.
              </small>
            </div>
          </>
        )}

        {mode === "interactive" && (
          <>
            <div className="drawer-heading">
              <span className="eyebrow">Selected person</span>
              {selectedPeopleNode && (
                <EvidenceBadge level={selectedPeopleNode.evidence} />
              )}
            </div>
            {selectedPeopleNode ? (
              <>
                <h2>{selectedPeopleNode.name}</h2>
                <p>{selectedPeopleNode.role}</p>
                <div className="drawer-section">
                  <span>Position in the structure</span>
                  <strong>{selectedPeopleNode.relationship}</strong>
                  <small>
                    {selectedParent
                      ? `${selectedPeopleNode.relationshipConfirmed ? "Confirmed connection to" : "Grouped with"} ${selectedParent.name}`
                      : `Top-level owner in ${selectedPeopleNode.group}`}
                  </small>
                </div>
                <div className="drawer-section">
                  <span>Role in a deal</span>
                  <strong>{selectedPeopleNode.dealRole}</strong>
                </div>
                <div className="drawer-section">
                  <span>Evidence status</span>
                  <div className="drawer-evidence">
                    <EvidenceBadge level={selectedPeopleNode.evidence} />
                    <div>
                      <strong>{selectedPeopleNode.status}</strong>
                      <small>
                        Reviewed{" "}
                        {peopleStructure?.asOf ?? company.verifiedAt}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="drawer-section">
                  <span>Source</span>
                  <strong>{selectedPeopleNode.sourceTitle}</strong>
                  <a
                    className="drawer-source-link"
                    href={selectedPeopleNode.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source ↗
                  </a>
                </div>
                <div className="drawer-section">
                  <span>Eric&apos;s action</span>
                  <strong>{company.nextAction}</strong>
                  <small>
                    Owner · {company.owner} · Due {company.nextActionDate}
                  </small>
                </div>
              </>
            ) : (
              <div className="version-empty">
                <strong>No named structure recovered</strong>
                <p>Add a verified person and source before drawing a line.</p>
              </div>
            )}
          </>
        )}

        {mode === "validation" && (
          <>
            <div className="drawer-heading">
              <span className="eyebrow">Evidence discipline</span>
            </div>
            <h2>What can we claim?</h2>
            <p>
              The diagram, the replica and the current company state are three
              separate evidence layers.
            </p>
            {evidenceLegend.map((item) => (
              <div className="drawer-evidence-rule" key={item.level}>
                <EvidenceBadge level={item.level} />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </div>
              </div>
            ))}
            <div className="drawer-section validation-warning">
              <span>Non-negotiable</span>
              <strong>
                A reconstructed structure never becomes “original” through
                repetition.
              </strong>
            </div>
          </>
        )}
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
