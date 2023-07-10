import { NextApiRequest, NextApiResponse } from 'next';
import { queryJisho } from '~/server/jishoCache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { term } = req.query;
  if(!term) {
    return res.status(400).json({ message: 'Missing search term' });
  } else if(typeof term !== 'string') {
    return res.status(400).json({ message: 'Invalid search term' });
  }

  // Perform the jisho query to get the search results
  const searchResults = await queryJisho(term);

  // Return the search results
  return res.status(200).json(searchResults);
};
