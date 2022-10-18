var client = algoliasearch('YSWWVAX5RB', '9fb3db0222f7b5aef0e2b30791ee6201');
var helper = algoliasearchHelper(client, 'restaurants', {hitsPerPage: 10, facets: ['food_type', 'rounded_rating', 'payment_options'], maxValuesPerFacet: 5});

// DOM
const app = document.querySelector('.app');
const searchInput = document.querySelector('.search-box');
const resultsArea = document.querySelector('.results');
const facetsArea = document.querySelector('.facets');
const metaData = document.querySelector('.metadata');
const paginationNav = document.querySelector('.pagination');
const currentPage = document.querySelector('.pagination__cur');
const pagination = document.querySelector('.pagination');
const resetBtn = document.querySelector('.reset');

// Global variables
let numPages;
const facetTypesArr = ['food_type', 'rounded_rating', 'payment_options'];

// Run default search
helper.search();

// Geo location
const successCallback = (position) => {
    // console.log(position);
    // console.log(position.coords.latitude, position.coords.longitude);
    helper.setQueryParameter('aroundLatLng', `${position.coords.latitude},${position.coords.longitude}`);
  };
  
  const errorCallback = (error) => {
    // console.log(error);
  };
  
navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

// Listeners
searchInput.addEventListener('keydown', logQuery);
facetsArea.addEventListener('click', updateFacets);
pagination.addEventListener('click', updatePages);
resetBtn.addEventListener('click', resetFilters);



// Event functions
function resetFilters(e) {
    e.preventDefault();
    helper.clearRefinements().search();
}


function updatePages(e) {

    // Get page count
    console.log(numPages);

    if(e.target.name === 'next' && helper.getPage() < numPages - 1) {
        const nextPage =  helper.nextPage().getPage();
        helper.setPage(nextPage).search();
    } else if(e.target.name === 'prev' && helper.getPage() !== 0) {
        const prevPage = helper.previousPage().getPage();
        helper.setPage(prevPage).search();
    }
}   


function logQuery(e) {
    helper.setQuery(e.target.value).search();
}


function updateFacets(e) {

    const facetType = e.target.parentElement.parentElement.id;
    const facetValue = e.target.name;

    // Toggle facet
    if(e.target.type === 'checkbox') {
        helper.toggleFacetRefinement(facetType, facetValue)
        .search();
    }

}


helper.on('result', function(event) {
    getPages(event.results);
    renderMetadata(event.results);
    renderHits(event.results);
    renderFacetList(event.results);
    renderPagination(event.results);
});


function getPages(content) {
    numPages = content.nbPages;
}


function renderPagination(content) {
    const currPage = helper.setPage(content.page).getPage() + 1;
    currentPage.innerHTML = `${currPage}`;
}
  


function renderHits(content) {

    resultsArea.innerHTML = '';

    const results = content.hits;

    results.forEach(hit => {
        resultsArea.innerHTML += `
            <li class="hit" id=${hit.objectID}>
                <div class="hit__head">
                    <img src=${hit.image_url} class="hit__img"/>
                </div>

                <div class="hit__tail">
                    <h2 class="hit__name">${hit.name}</h2>

                    <div class="hit__ratrevs">
                        <span class="hit__rating-count font--highlight">
                            ${hit.stars_count}
                        </span>
                        <span class="hit__stars">
                            ${renderStars(hit.stars_count, hit.objectID)}
                        </span>
                        <span class="hit__review-count font--light">
                            (${hit.reviews_count} reviews)
                        </span>
                    </div>
                    <div class="hit__info">
                        <p class="font--light">
                            ${hit.food_type} | ${hit.area} | ${hit.price_range}
                        </p>
                    </div>
                </div>
            </li>
        `

    });
}



// Render stars 

function renderStars(starsCount) {

    const maxStars = 5;

    const starPerc = (starsCount / maxStars) * 100;
    const starPercRoun = `${(Math.round(starPerc / 10) * 10)}%`;
    // document.querySelector(`#${id} .stars--inner`).style.width = starPercentageRounded;

    return  (
        `
        <div class="stars--outer">
            <div class="stars--inner" style="width: ${starPercRoun}">
            </div>
        </div>
        `
    )
}


// Render facets

function renderFacetList(content) {
    const facetTypes = content.facets.map(facet => facet.name);

    let html = '';

    facetTypes.forEach(type => {
        const facetValues = content.getFacetValues(type);
        let typeTitle = type === 'food_type' ? 'Cuisine' : type === 'rounded_rating' ? 'Rating' : type === "payment_options" ? 'Payment Options' : '';
        html += `<div>
                <h2 class="heading--${type}">${typeTitle}</h2>
                 <ul id=${type} class="facets__type">
        `
        if(type==='rounded_rating') {
            facetValues.forEach(value => {
                html += `
                <li class="facets__facet">
                    <input type="checkbox" ${value.isRefined ? 'checked' : ''} id="fl-${value.name}" name=${value.name} style="display: none" />
                    <label for="fl-${value.name}">
                        <span>${renderStars(value.name)}</span> <span>${value.count}</span>
                    </label>
                </li>
                `;
            })
        }

        else {
            facetValues.forEach(value => {
                html += `
                <li class="facets__facet">
                    <input type="checkbox" ${value.isRefined ? 'checked' : ''} id="fl-${value.name}" name="${value.name}" />
                    <label for="fl-${value.name}"><span>${value.name}</span> <span>${value.count}</span></label>
                </li>
                `;
                
            })

        }
        html += `</ul>
        </div> 
        `;
        facetsArea.innerHTML = html;
    })


    // If facet has refinement, add clear button
    facetTypes.forEach(facetType => {
        if(helper.hasRefinements(facetType) === true) {
            document.querySelector(`.heading--${facetType}`).innerHTML = 'something';
            // console.log(`${facetType} is true`)
        }
        // console.log(helper.hasRefinements(facetType));

    })

}


// Render metadata

const renderMetadata = (content)  => {
    const results = content.nbHits;
    const timeSeconds = content.processingTimeMS / 1000;

    let html = `
        <span class="metadata__results">
            ${results} results found
        </span>
        <span class="metadata__seconds"> 
            in ${timeSeconds} seconds
        </span>
    `
    metaData.innerHTML = html;
}


