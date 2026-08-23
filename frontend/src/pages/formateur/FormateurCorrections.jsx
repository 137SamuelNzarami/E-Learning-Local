import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { quizService } from "../../services/quizService";
import { attemptServiceExtended } from "../../services/attemptService";
import { studentAnswerServiceExtended } from "../../services/studentAnswerService";
import { getErrorMessage, formatDateTime, fullNameFromRow } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * Correction des tentatives (formateur propriétaire).
 * - Liste scopée par le backend : GET /attempts/quiz/:id_quiz/attempts ;
 * - Détail des réponses : GET /student-answers/attempt/:id_tentative ;
 * - Envoi de la note : PATCH /attempts/:id/corriger { notes: [...] }.
 * La note finale et le statut REUSSIE/ECHOUEE sont TOUJOURS calculés par le backend.
 */
export default function FormateurCorrections() {
  const [searchParams] = useSearchParams();
  const quizPreselect = Number(searchParams.get("quiz")) || null;

  const [rows, setRows] = useState([]); // tentatives enrichies { attempt, quiz }
  const [quizzesById, setQuizzesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [tab, setTab] = useState("A_CORRIGER");
  const [expanded, setExpanded] = useState(null);

  const [answersByAttempt, setAnswersByAttempt] = useState({});
  const [notesDraft, setNotesDraft] = useState({}); // { id_reponse_etudiant: string }
  const [corrigerBusy, setCorrigerBusy] = useState(false);
  const [corrigerError, setCorrigerError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qRes = await quizService.index();
        const quizzes = qRes.data || [];
        const qMap = {};
        for (const q of quizzes) qMap[q.id_quiz] = q;
        if (!cancelled) setQuizzesById(qMap);

        const lists = await Promise.all(
          quizzes.map(async (q) => {
            try {
              const res = await attemptServiceExtended.listByQuiz(q.id_quiz);
              return (res.data || []).map((a) => ({ ...a, _quiz: q }));
            } catch {
              return []; // quiz sans tentative ou accès refusé → ignoré
            }
          }),
        );
        const flat = lists.flat().sort((a, b) => {
          if (a.statut === "A_CORRIGER" && b.statut !== "A_CORRIGER") return -1;
          if (b.statut === "A_CORRIGER" && a.statut !== "A_CORRIGER") return 1;
          return String(b.date_soumission || "").localeCompare(String(a.date_soumission || ""));
        });
        if (!cancelled) setRows(flat);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openDetail = async (attempt) => {
    const isOpen = expanded === attempt.id_tentative;
    setCorrigerError(null);
    setExpanded(isOpen ? null : attempt.id_tentative);
    if (isOpen) return;
    const idTentative = attempt.id_tentative;
    try {
      const res = await studentAnswerServiceExtended.getByAttempt(idTentative);
      const records = res.data || [];
      setAnswersByAttempt((m) => ({ ...m, [idTentative]: records }));
      setNotesDraft((d) => {
        const next = { ...d };
        for (const r of records) {
          if (r.type_question === "LIBRE" && next[r.id_reponse_etudiant] === undefined) {
            next[r.id_reponse_etudiant] = r.note !== null && r.note !== undefined ? String(r.note) : "";
          }
        }
        return next;
      });
    } catch (err) {
      setError(err);
    }
  };

  const submitCorrection = async (attempt) => {
    setCorrigerBusy(true);
    setCorrigerError(null);
    try {
      const records = answersByAttempt[attempt.id_tentative] || [];
      const notes = records
        .filter((r) => r.type_question === "LIBRE")
        .map((r) => ({
          id_reponse_etudiant: r.id_reponse_etudiant,
          note: Number(notesDraft[r.id_reponse_etudiant]),
        }))
        .filter((n) => Number.isFinite(n.note));

      await attemptServiceExtended.corriger(attempt.id_tentative, { notes });
      setNotice(`Tentative #${attempt.id_tentative} corrigée. Le statut final a été recalculé par le serveur.`);

      // Rafraîchit la ligne + les réponses
      const refreshed = await attemptServiceExtended.listByQuiz(attempt._quiz.id_quiz);
      setRows((rs) =>
        rs.map((r) =>
          r.id_tentative === attempt.id_tentative
            ? { ...(refreshed.data || []).find((x) => x.id_tentative === attempt.id_tentative) || r, _quiz: r._quiz }
            : r,
        ),
      );
      const res = await studentAnswerServiceExtended.getByAttempt(attempt.id_tentative);
      setAnswersByAttempt((m) => ({ ...m, [attempt.id_tentative]: res.data || [] }));
    } catch (err) {
      setCorrigerError(err);
    } finally {
      setCorrigerBusy(false);
    }
  };

  const visible = useMemo(
    () => (tab === "ALL" ? rows : rows.filter((r) => r.statut === tab)),
    [rows, tab],
  );

  const pendingCount = rows.filter((r) => r.statut === "A_CORRIGER").length;

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Corrections"
        subtitle="Notes des questions libres — le statut final est calculé côté serveur"
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={getErrorMessage(error)} />}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["A_CORRIGER", `À corriger (${pendingCount})`],
          ["REUSSIE", "Réussies"],
          ["ECHOUEE", "Échouées"],
          ["SOUMISE", "Auto-corrigées"],
          ["ALL", "Toutes"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === key ? "bg-brand-700 text-white shadow-soft" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucune tentative"
            message={
              tab === "A_CORRIGER"
                ? "Rien à corriger pour le moment. Vous serez notifié dès qu'un étudiant soumet des réponses libres."
                : "Aucune tentative dans cette catégorie."
            }
            action={
              <Link to="/formateur/quizzes" className="btn-primary">
                Gérer mes quiz
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((attempt) => {
            const open = expanded === attempt.id_tentative;
            const records = answersByAttempt[attempt.id_tentative];
            const libres = (records || []).filter((r) => r.type_question === "LIBRE");
            return (
              <Card key={attempt.id_tentative} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        attempt.statut === "A_CORRIGER"
                          ? "bg-amber-50 text-amber-600"
                          : attempt.statut === "REUSSIE"
                            ? "bg-green-50 text-green-600"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icons.grades />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {fullNameFromRow(attempt)} · {attempt.quiz ?? quizzesById[attempt.id_quiz]?.titre}
                      </p>
                      <p className="text-xs text-slate-400">
                        Tentative #{attempt.id_tentative}
                        {attempt.date_soumission ? ` · soumise le ${formatDateTime(attempt.date_soumission)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge statut={attempt.statut} note={attempt.note} seuil={attempt.score_reussite} />
                    <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => openDetail(attempt)}>
                      {open ? "Réduire" : attempt.statut === "A_CORRIGER" ? "Corriger" : "Détail"}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-slate-100 p-4">
                    {!records ? (
                      <p className="text-sm text-slate-400">Chargement des réponses…</p>
                    ) : (
                      <>
                        <ul className="space-y-2">
                          {records.map((r) => (
                            <li key={r.id_reponse_etudiant} className="rounded-lg bg-slate-50 px-3 py-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium text-slate-800">{r.question}</p>
                                <Badge tone={r.type_question === "LIBRE" ? "violet" : "sky"}>
                                  {r.type_question === "LIBRE" ? "Libre" : "QCM"} · /{Number(r.points_question)}
                                </Badge>
                              </div>
                              {r.type_question === "QCM" ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  Choix : {r.reponse_choisie ?? "—"}
                                  {typeof r.est_correcte === "boolean" || r.est_correcte === 0 || r.est_correcte === 1
                                    ? r.est_correcte
                                      ? " · correcte ✓"
                                      : " · incorrecte ✗"
                                    : ""}
                                </p>
                              ) : (
                                <>
                                  <p className="mt-1 whitespace-pre-wrap rounded-md border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700">
                                    {r.reponse_libre || "(réponse vide)"}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <div className="w-32">
                                      <label className="label !mb-1 !text-xs">Note / {Number(r.points_question)}</label>
                                      <input
                                        className="input !py-1.5"
                                        type="number"
                                        min={0}
                                        max={Number(r.points_question)}
                                        step={0.5}
                                        value={notesDraft[r.id_reponse_etudiant] ?? ""}
                                        onChange={(e) =>
                                          setNotesDraft((d) => ({ ...d, [r.id_reponse_etudiant]: e.target.value }))
                                        }
                                      />
                                    </div>
                                    {typeof r.note === "number" && (
                                      <span className="pb-2 text-xs text-green-600">
                                        Notée : {r.note}/{Number(r.points_question)}
                                      </span>
                                    )}
                                  </div>
                                  <FieldError error={corrigerError} name={`note_${r.id_reponse_etudiant}`} />
                                </>
                              )}
                            </li>
                          ))}
                        </ul>

                        {attempt.statut === "A_CORRIGER" ? (
                          <div className="mt-4">
                            <FormAlert error={corrigerError} />
                            <button
                              type="button"
                              className="btn-primary"
                              disabled={corrigerBusy || libres.length === 0}
                              onClick={() => submitCorrection(attempt)}
                            >
                              {corrigerBusy ? "Envoi..." : "Envoyer la correction"}
                            </button>
                            <p className="mt-2 text-xs text-slate-400">
                              La note finale et le statut (réussite/échec contre le seuil du quiz) sont calculés par le backend.
                            </p>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-slate-400">
                            Statut final : <strong>{attempt.statut}</strong>
                            {attempt.note !== null && attempt.note !== undefined ? ` — ${Number(attempt.note)}/100` : ""}.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ statut, note, seuil }) {
  if (statut === "A_CORRIGER") return <Badge tone="amber">À corriger</Badge>;
  if (statut === "EN_COURS") return <Badge tone="neutral">En cours</Badge>;
  if (statut === "SOUMISE") return <Badge tone="sky">Soumise</Badge>;
  if (statut === "REUSSIE")
    return (
      <Badge tone="success">
        Réussie{note != null ? ` · ${Math.round(Number(note))}/100` : ""}
      </Badge>
    );
  if (statut === "ECHOUEE")
    return (
      <Badge tone="danger">
        Échouée{note != null ? ` · ${Math.round(Number(note))}/${seuil != null ? Math.round(Number(seuil)) : 100}` : ""}
      </Badge>
    );
  return <Badge tone="neutral">{statut}</Badge>;
}
