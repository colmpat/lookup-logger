import useSWRImmutable from "swr/immutable";
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
  const fetcher = async (url: string): Promise<JishoResult> => {
    const response = await fetch(url);
    const data = await response.json() as JishoResult;
    return data;
  };

  const { data, error } = useSWRImmutable<JishoResult>(`/api/search?term=${query}`, fetcher);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
  };
};
