function MovieCard({ movie, onClick }) {
    const { title, vote_average, poster_path, release_date, original_language } = movie;

    return(
        <li>
          <button
            aria-label={`Watch trailer for ${title}`}
            className="movie-card w-full cursor-pointer text-left transition hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            onClick={onClick}
            type="button"
          >
                <img src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : '/default-poster.jpg'} alt={title}
                 />

                 <div className="mt-4">
                    <h3>{title}</h3>
                    <div className="content">
                        <div className="rating">
                            <img src="/star.svg" alt="Star Icon" />
                            <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>

                        </div>
                        <span>•</span>
                        <p className="lang">{original_language}</p>
                        <span>•</span>

                        <p className="year">
                           {release_date ? release_date.split('-')[0] : 'N/A'}
                        </p>


                    </div>

                 </div>
          </button>
        </li>

    );
}

export default MovieCard;