function toCapitalize(sentence) {
    // Capitalize a sentense
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

async function fetchData(url) {
    /* Get the data from the API using a url
    Returns the response in json format 
    */
    const response = await fetch(url);
    if (!response.ok) {
        console.error('Network response was not ok:', response.statusText);
        return;
    }
    return await response.json(); // Parse the JSON response
}

async function fetchOfCategory(genre) {
    /* Get the the data for a specific category usign its genre
    Returns only the movies data as an array of dictionaries
    */
    const url = `http://localhost:8000/api/v1/titles?genre=${genre}&page_size=6&sort_by=-imdb_score`;
    const data = await fetchData(url);
    return data.results;
}

async function fetchBestMovie() {
    /* Get the the data for the best movie of the entire database
    */
    const url = 'http://localhost:8000/api/v1/titles?sort_by=-imdb_score';
    const moviesData = await fetchData(url);
    return await fetchMovieFromID(moviesData.results[0].id);
}

async function fetchMovieFromID(movieID) {
    /* Get the the data for a specific movie using its ID
    Returns the movie's data as a dictionary
    */
    const url = `http://localhost:8000/api/v1/titles/${movieID}`;
    return await fetchData(url);
}


async function fetchAllGenresPages() {
    /* In the API, fetch all the movies genre available
    Return them as a list
    */
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

async function builtBestMovie() {
    // Fills the best movie category with the content of the movie with the best imdb score
    const bestMovieData = await fetchBestMovie()
    const bestMovieSelector = document.querySelector('.best-movie');
    const title = bestMovieSelector.querySelector('.title');
    const image = bestMovieSelector.querySelector('img');
    const description = bestMovieSelector.querySelector('.description');
    const detailButton = bestMovieSelector.querySelector('button');

    title.innerText = bestMovieData.title;
    image.src = bestMovieData.image_url;
    image.alt = `Cover of the movie ${bestMovieData.title}`
    description.innerText = bestMovieData.description
    detailButton.setAttribute('data-film-id', bestMovieData.id)

    modalWindowSetUp(bestMovieSelector)
}


function buildCategory(moviesData, categorySelector) {
    /* Build the HTML code for a specific category
    Hides the necessary content depending on the device size
    */
    const categoryContainer = categorySelector.querySelector('.category-container');

    for (let j = 0; j < moviesData.length; j++) {
        const movieContent = `
            <div class="my-3 category-content content${j}">
                <div class="ratio ratio-1x1 position-relative">
                    <img src="${moviesData[j].image_url}" alt="Cover of the movie ${moviesData[j].title}" class="img-fluid objectfit-cover">
                    <div class="position-absolute w-100 film-label py-1">
                        <h3 class="h3 fw-bold fs-4 text-white text-start mx-4 mt-3 mt-md-2 movie-title">
                            ${moviesData[j].title}
                        </h3>
                        <div class="d-flex justify-content-end me-4">
                            <button class="btn film-details-button custom-film-button rounded-pill px-4"
                                data-bs-toggle="modal" data-bs-target="#filmModal" data-film-id="${moviesData[j].id}">Détails</button>
                        </div>
                    </div>
                </div>
            </div>`;
        categoryContainer.insertAdjacentHTML('beforeend', movieContent);
        let categoryContent = categoryContainer.querySelector(`.content${j}`);
        switch (j) {
            case 2:
            case 3:
                categoryContent.classList.add('d-none');
                categoryContent.classList.add('d-md-block');
                break;
            case 4:
            case 5:
                categoryContent.classList.add('d-none');
                categoryContent.classList.add('d-lg-block');
                break;
        }
        modalWindowSetUp(categorySelector);
        moreButtonSetUp(categorySelector);
        lessButtonSetUp(categorySelector);
    }
}

async function buildCategories() {
    // Loops over the three main categories to fetch the movies and fill the content accordingly
    for (let i = 1; i <= 3; i++) {
        const categorySelector = document.querySelector(`.category${i}`);
        const categoryGenre = categorySelector.getAttribute('data-genre');
        const categoryTitle = categorySelector.querySelector('.category-title');
        categoryTitle.innerText = toCapitalize(categoryGenre);

        const moviesData = await fetchOfCategory(categoryGenre);

        buildCategory(moviesData, categorySelector);
    }
}

async function buildOtherCategory() {
    /* Builds the Other Category :
    First build the dropdown menu.
    Then for each items of the dropdown menu, creates an eventListener that 
    builds the category according to the genre selected
    */
    const genres = await fetchAllGenresPages();
    buildDropDown(genres);
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    const categoryOtherSelector = document.querySelector('.categoryOther');
    const categoryOtherContainer = categoryOtherSelector.querySelector('.category-container');

    dropdownItems.forEach(dropdownItem => {
        dropdownItem.addEventListener('click', async function () {
            categoryOtherContainer.innerHTML = '';
            dropdownItems.forEach(i => {
                i.classList.remove('selected');
            })
            dropdownItem.classList.add('selected');
            categoryOtherSelector.querySelector('button').innerText = dropdownItem.innerText;
            const moviesCategoryData = await fetchOfCategory(dropdownItem.getAttribute('data-genre'));
            const moreButton = categoryOtherSelector.querySelector('.category-more-button');
            moreButton.classList.remove('d-none');
            buildCategory(moviesCategoryData, categoryOtherSelector);
            modalWindowSetUp(categoryOtherSelector);
        })
    })
}

function buildDropDown(genres) {
    /* From a list of genres, creates the dropdown menu for the last category
    */
    const dropDownMenu = document.querySelector('.dropdown-menu')
    for (let i = 0; i < genres.length; i++) {
        const li = document.createElement('li');
        li.textContent = genres[i];
        li.classList.add('dropdown-item');
        li.classList.add('w-100');
        li.classList.add('d-flex');
        li.classList.add('justify-content-between');
        li.setAttribute('data-genre', genres[i]);
        dropDownMenu.appendChild(li);
    }
}

async function modalWindowSetUp(categorySelector) {
    /* Set up the modal window for a specific category
    Creates an eventListener on all the movie details buttons that send the right information to the modal window to display
    */
    const filmsDetailButtons = categorySelector.querySelectorAll('.film-details-button');

    filmsDetailButtons.forEach(currentButton => {
        const filmID = currentButton.getAttribute('data-film-id');

        currentButton.addEventListener('click', async function () {
            const movieData = await fetchMovieFromID(filmID);
            const modalBody = document.querySelector('.modal-body');
            modalBody.querySelector('img').src = movieData.image_url;
            modalBody.querySelector('img').alt = `Cover of the movie ${movieData.title}`;
            modalBody.querySelector('.movie-title').innerText = movieData.original_title;
            modalBody.querySelector('.directors').innerText = movieData.directors.join(', ');
            modalBody.querySelector('.description').innerText = movieData.long_description;
            modalBody.querySelector('.actors-list').innerText = movieData.actors.join(', ');

            let movieContent = null;
            if (movieData.rated !== 'Not rated or unkown rating') {
                movieContent = `${movieData.year} - ${movieData.genres.join(', ')} <br>
                PG-${rated} - ${movieData.duration} minutes (${movieData.countries.join(' / ')}) <br>
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

function moreButtonSetUp(categorySelector) {
    const moreButton = categorySelector.querySelector('.category-more-button');
    const lessButton = categorySelector.querySelector('.category-less-button');

    moreButton.addEventListener('click', () => {
        const categoryContent = categorySelector.querySelectorAll('.category-content');
        for (let i = 0; i < categoryContent.length; i++) {
            categoryContent[i].classList.remove('d-none');
        }
        moreButton.classList.add('d-none')
        lessButton.classList.remove('d-none');
    })
}

function lessButtonSetUp(categorySelector) {
    const lessButton = categorySelector.querySelector('.category-less-button');
    const moreButton = categorySelector.querySelector('.category-more-button');

    lessButton.addEventListener('click', () => {
        const categoryContent = categorySelector.querySelectorAll('.category-content');

        for (let i = 2; i < categoryContent.length; i++) {
            categoryContent[i].classList.add('d-none');
        }
        lessButton.classList.add('d-none')
        moreButton.classList.remove('d-none');
        categorySelector.scrollIntoView({ behaviour: 'smooth' });
    })
}

async function initialisationApp() {
    await builtBestMovie()
    await buildCategories()
    await buildOtherCategory()
}

initialisationApp()