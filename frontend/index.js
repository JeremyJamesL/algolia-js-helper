var client = algoliasearch('YSWWVAX5RB', '9fb3db0222f7b5aef0e2b30791ee6201');
var helper = algoliasearchHelper(client, 'restaurants', {facets: ['food_type', 'rounded_rating', 'stars_count']});

// DOM
const app = document.querySelector('.app');
const searchInput = document.querySelector('.search-box');
const resultsArea = document.querySelector('.results');


// Listen on search input
searchInput.addEventListener('keydown', logQuery);

function logQuery(e) {
    helper.setQuery(e.target.value).search();
}


helper.search();

helper.on('result', function(event) {
    renderHits(event.results);
    renderFacetList(event.results);
});
  

// Render a result

function renderHits(content) {
    resultsArea.innerHTML = '';

    const results = content.hits;

    results.forEach(result => {
        resultsArea.innerHTML += `
            <li class="hit" id="${result.objectID}">
                ${result.name}
            </li>
        `
    });
}


// Render facets

function renderFacetList(content) {

    const facetTypes = content.facets.map(facet => facet.name);

    facetTypes.forEach(type => {
        const facetValues = content.getFacetValues(type);

        facetValues.forEach(value => {
            let html ='';
            html += `<input type ="checkbox" id="fl-${value.name}">`;
            console.log(html);
        })
        
    })








}


