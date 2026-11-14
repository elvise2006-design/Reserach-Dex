import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { useApp } from "@/context/AppContext";
import { errMsg } from "@/lib/format";

export interface Resource<T> { data: T | null; loading: boolean; error: string | null; reload(): void }

/** Loads data for the current corpus; reloads when the corpus changes or something calls bump(). */
export function useResource<T>(fn: (corpusId: string) => Promise<T>, deps: DependencyList = []): Resource<T> {
  const { corpus, version, mode } = useApp();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);
  const cid = corpus?.id;

  useEffect(() => {
    if (!cid) { setLoading(false); return; }
    const mine = ++seq.current;
    setLoading(true); setError(null);
    fn(cid).then((d) => { if (mine === seq.current) { setData(d); setLoading(false); } })
      .catch((e) => { if (mine === seq.current) { setError(errMsg(e)); setLoading(false); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, version, tick, mode, ...deps]);

  return { data, loading, error, reload: useCallback(() => setTick((t) => t + 1), []) };
}
