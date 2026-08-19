import { useCallback, useEffect, useRef, useState } from "react";

export function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fnRef.current();
      setData(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: execute, setData };
}

export function usePagination(total = 0, defaultLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const safePage = Math.min(page, totalPages);
  const effectivePage = page !== safePage ? safePage : page;

  return {
    page: effectivePage,
    limit,
    setPage,
    setLimit,
    totalPages,
    total,
  };
}
