var client = algoliasearch('YSWWVAX5RB', '9fb3db0222f7b5aef0e2b30791ee6201');
var helper = algoliasearchHelper(client, 'restaurants', {facets: ['food_type', 'rounded_rating', 'stars_count'], maxValuesPerFacet: 5});

// DOM
const app = document.querySelector('.app');
const searchInput = document.querySelector('.search-box');
const resultsArea = document.querySelector('.results');
const facetsArea = document.querySelector('.facets');


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

    let html = '';

    facetTypes.forEach(type => {
        const facetValues = content.getFacetValues(type);
        html += `<h2 id=${type}>${type}</h2>
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


