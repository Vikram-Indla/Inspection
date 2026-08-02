import Shell from "@/app/(app)/admin/_components/AdminShell";
import { getLocale } from "@/lib/i18n";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { formatDate, formatDateRange } from "@/lib/dates";
import { CreateDelegationForm, RevokeDelegationForm, type DelegationStrings } from "./DelegationForms";

export const dynamic = "force-dynamic";

type PersonRef = { full_name: string; email: string | null } | null;
type DelegationRow = {
  id: string; delegator_id: string; delegate_id: string; scope: string; reason: string;
  starts_at: string; ends_at: string; status: "active" | "revoked"; created_at: string;
  revoked_at: string | null; revoked_reason: string | null;
  delegator: PersonRef; delegate: PersonRef;
};

const VIEWS = ["active", "received", "new", "history"] as const;
type ViewKey = typeof VIEWS[number];

export default async function DelegationJourney({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const ar = locale === "ar";
  const view: ViewKey = (typeof sp.view === "string" && (VIEWS as readonly string[]).includes(sp.view)) ? sp.view as ViewKey : "active";

  const copy = ar ? {
    title: "التفويض", subtitle: "تفويض السلطة الحاكمة للأدوار مؤقتاً بين المستخدمين المصرح لهم",
    tabActive: "التفويضات النشطة", tabReceived: "المستلمة", tabNew: "تفويض جديد", tabHistory: "السجل",
    unavailableTitle: "قائمة التفويضات غير متاحة", unavailableBody: "فشلت القراءة المحكومة بسياسات RLS. لم يتم استنتاج أي بيانات.",
    emptyActiveTitle: "لا توجد تفويضات نشطة", emptyActiveBody: "لم تُنشئ أي تفويض نشط ضمن نطاق صلاحياتك بعد.",
    emptyReceivedTitle: "لا توجد تفويضات مستلمة", emptyReceivedBody: "لم يفوّضك أحد أي دور نشط حتى الآن.",
    emptyHistoryTitle: "لا يوجد سجل", emptyHistoryBody: "القراءة المقيّدة بسياسات RLS لم تُرجع أي تفويضات ضمن نطاقك.",
    noScopesTitle: "لا توجد أدوار قابلة للتفويض", noScopesBody: "لا تحمل أي دور حالياً يمكن تفويضه لمستخدم آخر.",
    delegator: "المفوِّض", delegate: "المفوَّض إليه", delegateHelp: "أدخل البريد الإلكتروني لمستخدم مصرّح له موجود في النظام.",
    scope: "نطاق الصلاحية (الدور)", reason: "السبب", startsAt: "تاريخ البدء", endsAt: "تاريخ الانتهاء",
    create: "إنشاء تفويض", creating: "جارٍ الإنشاء…", created: "تم الإنشاء",
    revoke: "إلغاء", revoking: "جارٍ الإلغاء…", revoked: "تم الإلغاء", revokeReason: "سبب الإلغاء", cancel: "إلغاء",
    window: "النافذة الزمنية", status: "الحالة", statusActive: "نشط", statusRevoked: "مُلغى", statusExpired: "منتهي",
    revokedNote: "أُلغي في",
  } : {
    title: "Delegation", subtitle: "Temporarily delegate a governed role's authority to another authorized user",
    tabActive: "Active", tabReceived: "Received", tabNew: "New Delegation", tabHistory: "History",
    unavailableTitle: "Delegation list unavailable", unavailableBody: "The RLS-scoped read failed. Nothing has been inferred.",
    emptyActiveTitle: "No active delegations", emptyActiveBody: "You haven't created an active delegation in your authorized scope yet.",
    emptyReceivedTitle: "No delegations received", emptyReceivedBody: "No one has delegated an active role to you yet.",
    emptyHistoryTitle: "No history", emptyHistoryBody: "The RLS-scoped read returned no delegations in your scope.",
    noScopesTitle: "No delegable roles", noScopesBody: "You don't currently hold a role that can be delegated to another user.",
    delegator: "Delegator", delegate: "Delegate", delegateHelp: "Enter the email of an existing authorized user.",
    scope: "Scope (role)", reason: "Reason", startsAt: "Starts", endsAt: "Ends",
    create: "Create delegation", creating: "Creating…", created: "Created",
    revoke: "Revoke", revoking: "Revoking…", revoked: "Revoked", revokeReason: "Revocation reason", cancel: "Cancel",
    window: "Window", status: "Status", statusActive: "Active", statusRevoked: "Revoked", statusExpired: "Expired",
    revokedNote: "Revoked",
  };

  const sb = await supabaseServer();
  const { data: { user }, error: userError } = await getServerUser();
  if (!user || userError) throw new Error("admin_delegation_auth_unavailable");

  const [rolesRead, myProfile] = await Promise.all([
    sb.from("user_roles").select("role_key, roles(title)").eq("user_id", user.id),
    sb.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const availableScopes = (rolesRead.data ?? []).map(row => ({
    key: row.role_key,
    title: (row as unknown as { roles: { title: string } | null }).roles?.title ?? row.role_key,
  }));
  const delegatorName = myProfile.data?.full_name ?? user.email ?? user.id;

  const strings: DelegationStrings = {
    delegator: copy.delegator, delegate: copy.delegate, delegateHelp: copy.delegateHelp, scope: copy.scope,
    reason: copy.reason, startsAt: copy.startsAt, endsAt: copy.endsAt, create: copy.create, creating: copy.creating,
    created: copy.created, revoke: copy.revoke, revoking: copy.revoking, revoked: copy.revoked,
    revokeReason: copy.revokeReason, cancel: copy.cancel,
  };

  let rows: DelegationRow[] = [];
  let readFailed = false;
  if (view !== "new") {
    const read = await sb.from("delegations")
      .select(`
        id,delegator_id,delegate_id,scope,reason,starts_at,ends_at,status,created_at,revoked_at,revoked_reason,
        delegator:profiles!delegations_delegator_id_fkey(full_name,email),
        delegate:profiles!delegations_delegate_id_fkey(full_name,email)
      `)
      .order("created_at", { ascending: false });
    readFailed = !!read.error;
    rows = (read.data ?? []) as unknown as DelegationRow[];
  }

  const now = Date.now();
  const effectiveStatus = (row: DelegationRow) => row.status === "revoked" ? "revoked"
    : new Date(row.ends_at).getTime() < now ? "expired" : "active";
  const statusLabel = (row: DelegationRow) => ({ active: copy.statusActive, revoked: copy.statusRevoked, expired: copy.statusExpired }[effectiveStatus(row)]);

  const activeRows = rows.filter(row => row.delegator_id === user.id && effectiveStatus(row) === "active");
  const receivedRows = rows.filter(row => row.delegate_id === user.id && effectiveStatus(row) === "active");
  const historyRows = rows;

  const dateRange = (row: DelegationRow) => formatDateRange(row.starts_at, row.ends_at, locale);

  const renderRow = (row: DelegationRow, showRevoke: boolean) => (
    <article className="panel" key={row.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <header className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="sq-overline">{row.scope}</p>
          <h4>{row.delegator?.full_name ?? copy.status} → {row.delegate?.full_name ?? copy.status}</h4>
        </div>
        <span className={`badge ${effectiveStatus(row) === "active" ? "badge-compliant" : effectiveStatus(row) === "expired" ? "badge-warning" : "badge-info"}`}>
          {statusLabel(row)}
        </span>
      </header>
      <dl className="cmp-approval-facts">
        <div><dt>{copy.window}</dt><dd className="numeric">{dateRange(row)}</dd></div>
        <div><dt>{copy.reason}</dt><dd>{row.reason}</dd></div>
        {row.revoked_at && <div><dt>{copy.revokedNote}</dt><dd className="numeric">{formatDate(row.revoked_at, locale)} — {row.revoked_reason}</dd></div>}
      </dl>
      {showRevoke && effectiveStatus(row) === "active" && <RevokeDelegationForm delegationId={row.id} strings={strings} />}
    </article>
  );

  return (
    <Shell current="/admin/delegation" title={copy.title} context={<span className="t-caption">{copy.subtitle}</span>}>
      <nav className="cmp-approval-filters" aria-label={copy.title}>
        {VIEWS.map(key => (
          <a key={key} className={`btn btn-touch ${view === key ? "btn-primary btn-lg" : "btn-secondary"}`}
            aria-current={view === key ? "page" : undefined}
            href={`/admin/delegation?view=${key}`}>
            {{ active: copy.tabActive, received: copy.tabReceived, new: copy.tabNew, history: copy.tabHistory }[key]}
          </a>
        ))}
      </nav>

      {view === "new" && (
        availableScopes.length === 0 ? (
          <div className="panel"><div className="saqeel-state" role="status"><span className="saqeel-state__glyph" aria-hidden="true">◇</span><h4>{copy.noScopesTitle}</h4><p className="t-caption">{copy.noScopesBody}</p></div></div>
        ) : (
          <CreateDelegationForm delegatorName={delegatorName} availableScopes={availableScopes} strings={strings} />
        )
      )}

      {view !== "new" && readFailed && (
        <div className="panel"><div className="saqeel-state" role="alert"><span className="saqeel-state__glyph" aria-hidden="true">⚠</span><h4>{copy.unavailableTitle}</h4><p className="t-caption">{copy.unavailableBody}</p><a className="sq-link" href={`/admin/delegation?view=${view}`}>{ar ? "إعادة المحاولة" : "Retry"}</a></div></div>
      )}

      {view === "active" && !readFailed && (
        activeRows.length === 0
          ? <div className="panel"><div className="saqeel-state" role="status"><span className="saqeel-state__glyph" aria-hidden="true">◇</span><h4>{copy.emptyActiveTitle}</h4><p className="t-caption">{copy.emptyActiveBody}</p></div></div>
          : <div className="stack">{activeRows.map(row => renderRow(row, true))}</div>
      )}

      {view === "received" && !readFailed && (
        receivedRows.length === 0
          ? <div className="panel"><div className="saqeel-state" role="status"><span className="saqeel-state__glyph" aria-hidden="true">◇</span><h4>{copy.emptyReceivedTitle}</h4><p className="t-caption">{copy.emptyReceivedBody}</p></div></div>
          : <div className="stack">{receivedRows.map(row => renderRow(row, false))}</div>
      )}

      {view === "history" && !readFailed && (
        historyRows.length === 0
          ? <div className="panel"><div className="saqeel-state" role="status"><span className="saqeel-state__glyph" aria-hidden="true">◇</span><h4>{copy.emptyHistoryTitle}</h4><p className="t-caption">{copy.emptyHistoryBody}</p></div></div>
          : <div className="table-wrap"><table className="table"><caption className="sr-only">{copy.title} {copy.tabHistory}</caption>
              <thead><tr><th scope="col">{copy.delegator}</th><th scope="col">{copy.delegate}</th><th scope="col">{copy.scope}</th><th scope="col">{copy.window}</th><th scope="col">{copy.status}</th></tr></thead>
              <tbody>{historyRows.map(row => (
                <tr key={row.id}>
                  <th scope="row">{row.delegator?.full_name ?? "—"}</th>
                  <td>{row.delegate?.full_name ?? "—"}</td>
                  <td>{row.scope}</td>
                  <td className="numeric">{dateRange(row)}</td>
                  <td><span className={`badge ${effectiveStatus(row) === "active" ? "badge-compliant" : effectiveStatus(row) === "expired" ? "badge-warning" : "badge-info"}`}>{statusLabel(row)}</span></td>
                </tr>
              ))}</tbody>
            </table></div>
      )}
    </Shell>
  );
}
