async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Network response was not ok:', response.statusText);
        return;
    }
    return await response.json(); // Parse the JSON response
}

async function fetchOfCategory(genre) {
    const url = `http://localhost:8000/api/v1/titles?genre=${genre}&page_size=6&sort_by=-imdb_score`;
    const data = await fetchData(url);
    return data.results;
}

async function fetchBestMovie() {
    const url = 'http://localhost:8000/api/v1/titles?sort_by=-imdb_score';
    const moviesData = await fetchData(url);
    return await fetchMovieFromID(moviesData.results[0].id);
}

async function fetchMovieFromID(movieID) {
    const url = `http://localhost:8000/api/v1/titles/${movieID}`;
    return await fetchData(url);
}


async function fetchAllGenresPages() {
    let genres = []; // Array to hold all the data
    let currentPage = 1; // Start from the first page

    while (true) {
        const url = `http://localhost:8000/api/v1/genres?page=${currentPage}`;
        const genreData = await fetchData(url); // Parse the JSON response
        for (let i = 0; i < genreData.results.length; i++) {
            genres.push(genreData.results[i].name);
        }
        if (genreData.next === null) break;
        currentPage++; // Increment to fetch the next page
    }
    return genres; // Return the combined data
}

function buildDropDown(genres) {
    const dropDownMenu = document.querySelector('.dropdown-menu')
    for (let i = 0; i < genres.length; i++) {
        const li = document.createElement('li');
        li.textContent = genres[i];
        li.classList.add('dropdown-item')
        li.classList.add('pe-5')
        li.setAttribute('data-genre', genres[i])
        dropDownMenu.appendChild(li);
    }
}

function toCapitalize(sentence) {
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

async function buildOtherCategory() {
    const genreList = await fetchAllGenresPages();
    buildDropDown(genreList);
    let dropdownItems = document.querySelectorAll('.dropdown-item')
}

async function buildCategories() {
    for (let i = 1; i <= 3; i++) {
        const category = document.querySelector(`.category${i}`);
        const categoryGenre = category.getAttribute('data-genre');
        const categoryTitle = category.querySelector('.category-title');
        categoryTitle.innerText = toCapitalize(categoryGenre);

        const moviesData = await fetchOfCategory(categoryGenre);
        const categoryContent = category.querySelectorAll('.category-content');

        for (let j = 0; j < categoryContent.length; j++) {
            const imgElement = categoryContent[j].querySelector('img');
            imgElement.src = moviesData[j].image_url;
            imgElement.alt = `Cover of the movie ${moviesData[j].title}`

            const movieTitle = categoryContent[j].querySelector('h3');
            movieTitle.innerText = moviesData[j].title;

            const detailButton = categoryContent[j].querySelector('button')
            detailButton.setAttribute('data-film-id', moviesData[j].id)
        }
    }
}

async function builtBestMovie() {
    const bestMovieData = await fetchBestMovie()
    const bestMovie = document.querySelector('.best-movie');
    const title = bestMovie.querySelector('.title');
    const image = bestMovie.querySelector('img');
    const description = bestMovie.querySelector('.description');
    const detailButton = bestMovie.querySelector('button');

    title.innerText = bestMovieData.title;
    image.src = bestMovieData.image_url;
    image.alt = `Cover of the movie ${bestMovieData.title}`
    description.innerText = bestMovieData.description
    detailButton.setAttribute('data-film-id', bestMovieData.id)

}

async function modalWindowSetUp() {
    const filmsDetailButtons = document.querySelectorAll('.film-details-button');
    filmsDetailButtons.forEach(currentButton => {
        const filmID = currentButton.getAttribute('data-film-id');
        currentButton.addEventListener('click', async function () {
            const movieData = await fetchMovieFromID(filmID);
            console.log(movieData);
            const modalBody = document.querySelector('.modal-body');
            modalBody.querySelector('img').src = movieData.image_url;
            modalBody.querySelector('img').alt = `Cover of the movie ${movieData.title}`;
            modalBody.querySelector('.movie-title').innerText = movieData.title;
            modalBody.querySelector('.directors').innerText = movieData.directors.join(', ');
            modalBody.querySelector('.description').innerText = movieData.long_description;
            modalBody.querySelector('.actors-list').innerText = movieData.actors.join(', ');

            let movieContent = null;
            if (movieData.rated !== 'Not rated or unkown rating'){
                movieContent = `${movieData.year} - ${movieData.genres.join(', ')} <br>
                PG-${rated} - ${movieData.duration} minutes (${movieData.countries.join (' / ')}) <br>
                IMDB score: ${movieData.imdb_score}/10`
            } else {
                movieContent = `${movieData.year} - ${movieData.genres.join(', ')} <br>
                ${movieData.duration} minutes (${movieData.countries.join(' / ')}) <br>
                IMDB score: ${movieData.imdb_score}/10`
            }
            modalBody.querySelector('.movie-content').innerHTML = movieContent;
        })
    })
}

async function initialisationApp() {
    await buildCategories()
    await buildOtherCategory()
    await builtBestMovie()
    modalWindowSetUp()
}

initialisationApp()