import { useEffect, useMemo, useState } from "react";
import { moduleService } from "../services/moduleService";
import { chapterService } from "../services/chapterService";
import { lessonService } from "../services/lessonService";
import { useOwnedFormations } from "./useOwnedFormations";

export function useOwnedLessons() {
  const { formations, loading: loadingFormations } = useOwnedFormations();
  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [m, c, l] = await Promise.all([
        moduleService.index(),
        chapterService.index(),
        lessonService.index(),
      ]);
      setModules(m.data || []);
      setChapters(c.data || []);
      setLessons(l.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingFormations) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingFormations]);

  const ownedLessonIds = useMemo(() => {
    const formationIds = new Set(formations.map((f) => f.id_formation));
    const moduleIds = new Set(modules.filter((m) => formationIds.has(m.id_formation)).map((m) => m.id_module));
    const chapterIds = new Set(chapters.filter((c) => moduleIds.has(c.id_module)).map((c) => c.id_chapitre));
    return new Set(lessons.filter((l) => chapterIds.has(l.id_chapitre)).map((l) => l.id_lecon));
  }, [formations, modules, chapters, lessons]);

  const ownedLessons = lessons.filter((l) => ownedLessonIds.has(l.id_lecon));

  return {
    lessons: ownedLessons,
    formations,
    modules,
    chapters,
    loading: loading || loadingFormations,
    error,
    reload: load,
  };
}
