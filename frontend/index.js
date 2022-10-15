var client = algoliasearch('YSWWVAX5RB', '9fb3db0222f7b5aef0e2b30791ee6201');
var helper = algoliasearchHelper(client, 'restaurants', {facets: ['food_type', 'rounded_rating', 'payment_options'], maxValuesPerFacet: 5});

// DOM
const app = document.querySelector('.app');
const searchInput = document.querySelector('.search-box');
const resultsArea = document.querySelector('.results');
const facetsArea = document.querySelector('.facets');
const metaData = document.querySelector('.metadata');


const successCallback = (position) => {
    console.log(position);
    console.log(position.coords.latitude, position.coords.longitude);
    helper.setQueryParameter('aroundLatLng', `${position.coords.latitude},${position.coords.longitude}`);
  };
  
  const errorCallback = (error) => {
    console.log(error);
  };
  
navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

// Listen on search input
searchInput.addEventListener('keydown', logQuery);
facetsArea.addEventListener('click', updateFacets);


function logQuery(e) {
    helper.setQuery(e.target.value).search();
}


function updateFacets(e) {
    // console.log(e);
    if(e.target.type === 'checkbox') {
        const facetValue = e.target.name;
        const type = e.target.parentElement.parentElement.id;
        helper.toggleFacetRefinement(type, facetValue)
        .search();
    }
}


helper.search();

helper.on('result', function(event) {
    renderMetadata(event.results);
    console.log(event);
    renderHits(event.results);
    renderFacetList(event.results);
});
  

// Render a result

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

function renderStars(starsCount, id) {
    console.log(starsCount,id)

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
        let typeTitle = type === 'food_type' ? 'Cuisine / Food Type' : type === 'rounded_rating' ? 'Rating' : type === "payment_options" ? 'Payment Options' : '';
        html += `<h2 id=${type}>${typeTitle}</h2>
                 <ul id=${type}>
        `
        facetValues.forEach(value => {
            html += `
            <li>
                <input type="checkbox" ${value.isRefined ? 'checked' : ''} id="fl-${value.name}" name=${value.name} />
                <label for="fl-${value.name}">${value.name} (${value.count})</label>
            </li>
            `;
            
        })
        html += "</ul>";
        facetsArea.innerHTML = html;
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


