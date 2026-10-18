import Search from './components/Search';
import { useState, useEffect } from 'react';
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { testConnection } from './lib/testConnection';
import { updateSearchCount,getTrendingMovies  } from './lib/appwrite.js';

const fetchTmdb = (path, parameters = {}, options = {}) => {
  const searchParams = new URLSearchParams({ path, ...parameters });
  return fetch(`/api/tmdb?${searchParams.toString()}`, {
    ...options,
    headers: { accept: 'application/json' },
  });
};

function App() {


  const [searchTerm, setSearchTerm] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [movies, setMovies] = useState([]);
  const [isloading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState('');
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [trailerError, setTrailerError] = useState('');

  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 500, [searchTerm]);

  const loadTrendingMovies = async () => {
    try {
      const response = await getTrendingMovies();
      setTrendingMovies(response);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  };

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');
    try{
      const response = query
        ? await fetchTmdb('search/movie', { query })
        : await fetchTmdb('discover/movie', { sort_by: 'popularity.desc' });
      if (!response.ok) {
        throw new Error(`Failed to fetch movies`);
      }
      const data = await response.json();
      if (data.response === 'False') {
        setErrorMessage(data.error || 'An error occurred while fetching movies.');
        setMovies([]);
        return;
      }
      setMovies(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    }
    catch (error) {
      console.log(`Error fetching movies : ${error}`);
      setErrorMessage('Error fetching moves. Please try again later.');
    }
    finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  },[debouncedSearchTerm] );

  const openMovieTrailer = (movie) => {
    setSelectedMovie(movie);
    setTrailerKey('');
    setTrailerError('');
    setIsTrailerLoading(true);
  };

  useEffect(() => {
    if (!selectedMovie) {
      return undefined;
    }

    const controller = new AbortController();
    const loadTrailer = async () => {
      try {
        const response = await fetchTmdb(
          `movie/${selectedMovie.id}/videos`,
          { language: 'en-US' },
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`TMDB returned ${response.status} while loading the trailer.`);
        }

        const data = await response.json();
        const videos = data.results || [];
        const trailer = videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer')
          || videos.find((video) => video.site === 'YouTube');

        if (trailer) {
          setTrailerKey(trailer.key);
        } else {
          setTrailerError('No trailer is available for this movie.');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching movie trailer:', error);
          setTrailerError('Could not load the trailer. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsTrailerLoading(false);
        }
      }
    };

    loadTrailer();
    return () => controller.abort();
  }, [selectedMovie]);

  useEffect(() => {
    if (!selectedMovie) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedMovie(null);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedMovie]);

  useEffect(() => {
  testConnection().catch((error) => {
    console.error('Appwrite ping failed:', error);
  });
}, []);
  return (
    <main>

      <div className="pattern"/>

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero-Banner" />
          <h1>Find <span className="text-gradient">Movies</span> You Enjoy Without the Hustle</h1>

        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>
                    {index + 1}
                    <button
                      aria-label={`Watch trailer for ${movie.searchTerm || 'trending movie'}`}
                      className="cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      onClick={() => openMovieTrailer({
                        id: movie.movie_id,
                        title: movie.searchTerm || 'Trending movie',
                      })}
                      type="button"
                    >
                      <img src={movie.poster_url} alt={movie.searchTerm || 'Trending movie'} />
                    </button>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>
            All Movies
          </h2>

          {isloading ? (
            <Spinner />
          ) :errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ): (
            <ul>
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onClick={() => openMovieTrailer(movie)} />
              ))}
            </ul>
          )} 
        </section>

        {selectedMovie && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedMovie(null)}
          >
            <section
              aria-labelledby="trailer-title"
              aria-modal="true"
              className="w-full max-w-3xl rounded-2xl bg-dark-100 p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-white" id="trailer-title">
                  {selectedMovie.title} — Trailer
                </h2>
                <button
                  aria-label="Close trailer"
                  className="rounded-lg px-3 py-2 text-white hover:bg-white/10"
                  onClick={() => setSelectedMovie(null)}
                  type="button"
                >
                  Close
                </button>
              </div>
              {isTrailerLoading ? (
                <p className="py-12 text-center text-gray-200">Loading trailer...</p>
              ) : trailerError ? (
                <p className="py-12 text-center text-gray-200">{trailerError}</p>
              ) : (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="aspect-video w-full rounded-lg"
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}`}
                  title={`${selectedMovie.title} trailer`}
                />
              )}
            </section>
          </div>
        )}

      </div>

    </main>
   
  );
}

export default App;