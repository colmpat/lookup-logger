import { Redis } from "@upstash/redis"
import { env } from "~/env.mjs"

export type JishoResult = {
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
  const cachedResult = await redis.get<JishoResult>(word);
  if(!cachedResult) {
    console.log(`\tcache miss for "${word}"`);
    return null;
  }
  console.log(`\tcache hit for "${word}"`);

  return cachedResult;
}

/**
 * Caches the given Jisho result for the given word.
 *
 * @param word The word to cache the Jisho result for.
 * @param result The Jisho result to cache.
 * @returns True if the Jisho result was successfully cached, false otherwise.
 * @throws {Error} If the Jisho result could not be stringified.
 */
export const cacheJishoResult = async (word: string, result: JishoResult): Promise<void> => {
  const cacheResult = await redis.set(word, JSON.stringify(result.data));
  if(!cacheResult || cacheResult !== 'OK') {
    console.error(`\tfailed to cache Jisho result for ${word}`)
  } else {
    console.log(`\tcached Jisho result for "${word}"`)
  }
}

export const queryJisho = async (word: string, cache = true): Promise<JishoResult> => {
  console.log(`Querying Jisho for "${word}"...`);
  const cachedResult = await getCachedJishoResult(word);
  if(cachedResult) {
    return cachedResult;
  }

  const result = await fetch(`${JISHO_URL}${encodeURIComponent(word)}`);
  const jishoResult = await result.json() as JishoResult;

  if(cache) {
    await cacheJishoResult(word, jishoResult);
  }

  return jishoResult;
}
