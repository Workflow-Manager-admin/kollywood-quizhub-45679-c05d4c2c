/**
 * TMDb API utility/service for Kollywood QuizHub
 */

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = '5bc67d3b06aecbd18121a3cbbc16eb59';
// Kollywood is Tamil cinema. We use with_original_language=ta for Tamil movies,
// and 'region=IN' as a fallback, or custom queries for other quiz types.

/**
 * PUBLIC_INTERFACE
 * Fetches Kollywood (Tamil) movies from TMDb by popularity.
 * @param {number} page - Which page of results to fetch (default 1)
 * @returns {Promise<Object>} - TMDb response object containing movie results
 */
export async function fetchKollywoodMovies(page = 1) {
  // See https://developers.themoviedb.org/3/discover/movie-discover for details
  const url = `${TMDB_API_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ta&sort_by=popularity.desc&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch Kollywood movies');
  }
  const data = await response.json();
  return data;
}



/**
 * PUBLIC_INTERFACE
 * Fetch movie details by TMDb movie ID.
 * @param {number} movieId - TMDb movie ID
 * @returns {Promise<Object>} - TMDb movie details
 */
export async function fetchMovieDetails(movieId) {
  const url = `${TMDB_API_BASE}/movie/${movieId}?api_key=${TMDB_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch movie details');
  }
  const data = await response.json();
  return data;
}

/**
 * PUBLIC_INTERFACE
 * Search for Kollywood (Tamil) movies by query/title.
 * @param {string} query - Search term (movie name, etc.)
 * @param {number} page - Which page of results (default 1)
 * @returns {Promise<Object>} - TMDb response with search results
 */
export async function searchKollywoodMovies(query, page = 1) {
  const url = `${TMDB_API_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&with_original_language=ta&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to search Kollywood movies');
  }
  const data = await response.json();
  return data;
}


