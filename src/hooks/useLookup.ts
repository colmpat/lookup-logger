import useSWRImmutable from "swr/immutable";
import { type BareFetcher } from "swr";
import { JishoResult } from "~/server/jishoCache";

/**
  * useLookup is a custom hook that fetches data from the search API.
  *
  * @param query The query to search for.
  * @returns The data, loading state, and error state.
  * @throws {Error} If the fetch fails.
  * @see https://swr.vercel.app/
  */
export const useLookup = (query: string) => {
  const fetcher: BareFetcher<JishoResult> = async (url: string) => {
    const response = await fetch(url);
    const data = await response.json() as JishoResult;
    return data;
  };

  const { data, error } = useSWRImmutable<JishoResult, Error>(`/api/search?term=${query}`, fetcher);

  return {
    data,
    error,
    isLoading: !error && !data,
  };
};
