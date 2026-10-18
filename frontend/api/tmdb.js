const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const ALLOWED_PATHS = [
  /^search\/movie$/,
  /^discover\/movie$/,
  /^movie\/\d+\/videos$/,
];
const ALLOWED_PARAMETERS = new Set(['path', 'query', 'sort_by', 'language']);

export default async function handler(request, response, options = {}) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const token = options.token || globalThis.process?.env?.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) {
    console.error('TMDB_API_READ_ACCESS_TOKEN is not configured.');
    return response.status(500).json({ error: 'Movie service is not configured.' });
  }

  const requestUrl = new URL(request.url, 'http://localhost');
  const path = requestUrl.searchParams.get('path') || '';

  if (!ALLOWED_PATHS.some((allowedPath) => allowedPath.test(path))) {
    return response.status(400).json({ error: 'Unsupported movie request.' });
  }

  for (const parameter of requestUrl.searchParams.keys()) {
    if (!ALLOWED_PARAMETERS.has(parameter)) {
      return response.status(400).json({ error: 'Unsupported query parameter.' });
    }
  }

  const upstreamParameters = new URLSearchParams();
  const query = requestUrl.searchParams.get('query');
  const sortBy = requestUrl.searchParams.get('sort_by');
  const language = requestUrl.searchParams.get('language');

  if (query !== null) {
    if (!query.trim() || query.length > 200 || !path.startsWith('search/')) {
      return response.status(400).json({ error: 'Invalid search query.' });
    }
    upstreamParameters.set('query', query.trim());
  }

  if (sortBy !== null) {
    if (sortBy !== 'popularity.desc' || path !== 'discover/movie') {
      return response.status(400).json({ error: 'Invalid sort option.' });
    }
    upstreamParameters.set('sort_by', sortBy);
  }

  if (language !== null) {
    if (!/^[a-z]{2}-[A-Z]{2}$/.test(language) || !path.endsWith('/videos')) {
      return response.status(400).json({ error: 'Invalid language option.' });
    }
    upstreamParameters.set('language', language);
  }

  try {
    const upstreamUrl = `${TMDB_API_BASE_URL}/${path}?${upstreamParameters.toString()}`;
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await upstreamResponse.json();

    response.setHeader('Cache-Control', 'private, no-store');
    return response.status(upstreamResponse.status).json(data);
  } catch (error) {
    console.error('TMDB request failed:', error);
    return response.status(502).json({ error: 'Movie service request failed.' });
  }
}
