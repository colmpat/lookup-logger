import { Redis } from "@upstash/redis"
import { env } from "~/env.mjs"

type JishoResult = {
  meta: {
    status: number,
  },
  data: JishoEntry[],
}

export type JishoEntry = {
  slug: string,
  is_common: boolean,
  tags: string[],
  jlpt: string[],
  japanese: {
    word?: string,
    reading: string,
  }[],
  senses: {
    english_definitions: string[],
    parts_of_speech: string[],
    links: {
      text: string,
      url: string,
    }[],
    tags: string[],
    restrictions: string[],
    see_also: string[],
    antonyms: string[],
    source: {
      language: string,
      word: string,
    }[],
    info: string[],
  }[],
}

const JISHO_URL = 'https://jisho.org/api/v1/search/words?keyword=';
const redis = new Redis({
  url: env.REDIS_URL,
  token: env.REDIS_TOKEN,
});

/**
 * Retrieves the cached Jisho result for the given word.
 *
 * @param word The word to retrieve the cached Jisho result for.
 * @returns The cached Jisho result for the given word, or null if no cached result exists.
 * @throws {Error} If the cached result is not a string or string[].
 */
export const getCachedJishoResult = async (word: string): Promise<JishoResult | null> => {
  const cachedResult = await redis.get(word);
  if(!cachedResult) {
    console.log(`\tcache miss for "${word}"`);
    return null;
  }
  console.log(`\tcache hit for "${word}"`);

  return cachedResult as JishoResult;
}

/**
 * Caches the given Jisho result for the given word.
 *
 * @param word The word to cache the Jisho result for.
 * @param result The Jisho result to cache.
 * @returns True if the Jisho result was successfully cached, false otherwise.
 * @throws {Error} If the Jisho result could not be stringified.
 */
export const cacheJishoResult = async (word: string, result: JishoResult): Promise<boolean> => {
  const cacheResult = await redis.set(word, JSON.stringify(result));
  if(!cacheResult || cacheResult !== 'OK') {
    console.error(`\tfailed to cache Jisho result for ${word}`)
    return false;
  } else {
    console.log(`\tcached Jisho result for "${word}"`)
    return true;
  }
}

export const queryJisho = async (word: string, cache: boolean = true): Promise<JishoEntry[]> => {
  console.log(`Querying Jisho for "${word}"...`);
  const cachedResult = await getCachedJishoResult(word);
  if(cachedResult) {
    if(cachedResult.meta.status !== 200) {
      console.error(`\tJisho returned status ${cachedResult.meta.status} for "${word}"`);
      return [];
    }
    return cachedResult.data;
  }

  const result = await fetch(`${JISHO_URL}${encodeURIComponent(word)}`);
  const json = await result.json();

  if(cache) {
    await cacheJishoResult(word, json);
  }

  return json;
}
