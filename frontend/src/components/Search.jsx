const Search = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className="search">
           <div>
              <img src="./search.svg" alt="search-icon" />

              <input
                type="text"
                placeholder="Search for a movie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <h1 className="text-white">{searchTerm}</h1>
           </div>
        </div>
    );
}

export default Search;