// Global variables
import {API_ID, SEARCH_API_KEY} from "./modules/creds.js";
var client = algoliasearch(API_ID, SEARCH_API_KEY);
var helper = algoliasearchHelper(client, 'restaurants', {hitsPerPage: 10, facets: ['food_type', 'rounded_rating', 'payment_options', 'price_range', 'dining_style' ], maxValuesPerFacet: 5});

// Data controller
const dataController = (function() {

    let numPages;

    return {
        updatePageNum: function(content) {
            numPages = content.nbPages;
        },

        currentPageNum: function() {
            return numPages;
        }
    }
    
})();


// Interface controller

const interfaceController = (function() {

    const DOMStrings = {
        app: '.app',
        searchInput: '.search-box',
        resultsArea: '.results',
        facetsArea: '.facets',
        metaData: '.metadata',
        currentPage: '.pagination__cur',
        pagination: '.pagination',
        sorting: '.sorting'
    }

    return {

        renderStars: function(starsCount) {
            const maxStars = 5;

            const starPerc = (starsCount / maxStars) * 100;
            const starPercRoun = `${(Math.round(starPerc / 10) * 10)}%`;
        
            return  (
                `
                <div class="stars--outer">
                    <div class="stars--inner" style="width: ${starPercRoun}">
                    </div>
                </div>
                `
            )
        },

        renderHits: function(content) {

            // Get results area and hits
            const resultsArea = document.querySelector(DOMStrings.resultsArea);
            const results = content.hits;
            
            // Clear inner HTML
            resultsArea.innerHTML = '';
            
            results.forEach(hit => {

                // Make reserve URL mobile friendly
                let reserveUrl;
                if (window.matchMedia("(max-width: 767px)").matches)
                {
                    // If viewport is less than 768 pixels wide = mobile user
                    reserveUrl = hit.mobile_reserve_url;
                } else {
                    reserveUrl = hit.reserve_url;
                }

                resultsArea.innerHTML += `
                    <li class="hit" id=${hit.objectID}>
                        <div class="hit__head">
                            <img src=${hit.image_url} class="hit__img"/>
                        </div>
        
                        <div class="hit__tail">
                            <h2 class="hit__name">${hit.name}</h2>
                            <a href="${reserveUrl}" class="hit__book">
                                Book now
                            </a>
    
                            <div class="hit__ratrevs">
                                <span class="hit__rating-count font--highlight">
                                    ${hit.stars_count}
                                </span>
                                <span class="hit__stars">
                                    ${interfaceController.renderStars(hit.stars_count)}
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
        },

        renderFacetList: function(content) {

            // Get facetTypes
            const facetTypes = content.facets.map(facet => facet.name);

            let html = '';

            // Iterate and render each facetType
            facetTypes.forEach(type => {
                const facetValues = content.getFacetValues(type);
                let typeTitle;

                // Set facetType title
                switch(type) {
                    case 'food_type':
                        typeTitle = 'Cuisine';
                        break; 
                    case 'rounded_rating':
                        typeTitle = 'Rating';
                        break;
                    case 'payment_options':
                        typeTitle = 'Payment Options';
                        break;
                    case 'price_range':
                        typeTitle = 'Price';
                        break;
                    case 'dining_style':
                        typeTitle = 'Dining Style';
                        break;
                    default: 
                        typeTitle = 'Filter' 
                }
                
                html += `<div>
                        <div class="facets__header">
                            <h2 class="facets__heading heading--${type}">${typeTitle}</h2>
                        </div>
                         <ul id=${type} class="facets__type">
                `
                if(type === 'rounded_rating') {
                    facetValues.forEach(value => {
                        html += `
                        <li class="facets__facet">
                            <input type="checkbox" ${value.isRefined ? 'checked' : ''} id="fl-${value.name}" name=${value.name} style="display: none" />
                            <label for="fl-${value.name}">
                                <span>${interfaceController.renderStars(value.name)}</span> <span>${value.count}</span>
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
                </div> `;
                document.querySelector(DOMStrings.facetsArea).innerHTML = html;
            });


            // If facet has refinement, add reset button
            facetTypes.forEach(facetType => {
                if(helper.hasRefinements(facetType) === true) {
                    const heading = document.querySelector(`.heading--${facetType}`);
                    const delBtn = document.createElement("button");
                    delBtn.textContent = 'Reset';
                    delBtn.classList.add("facets__reset", `reset--${facetType}`);
                    delBtn.setAttribute("id", `reset--${facetType}`)
                    heading.after(delBtn);
                }
            });
        },


        updateFacets: function(e) { 

            // Toggle facet
            if(e.target.type === 'checkbox') {
                const facetType = e.target.parentElement.parentElement.id;
                const facetValue = e.target.name;
                helper.toggleFacetRefinement(facetType, facetValue).search()
            }

            // Handle reset click
            if(e.target.classList.contains('facets__reset')) {
                const facetType = e.target.id;
                const facetTypeNew = facetType.replace('reset--', '');
                helper.clearRefinements(facetTypeNew).search();
            }
        },


        renderMetadata: function(content) {
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
            document.querySelector(DOMStrings.metaData).innerHTML = html;
        },

        renderPagination: function(content) {
            const currPage = helper.setPage(content.page).getPage() + 1;
            document.querySelector(DOMStrings.currentPage).innerHTML = `${currPage}`;
        },

        updatePages: function(e,numPages) {
            if(e.target.name === 'next' && helper.getPage() < numPages - 1) {
                const nextPage =  helper.nextPage().getPage();
                helper.setPage(nextPage).search();
            } else if(e.target.name === 'prev' && helper.getPage() !== 0) {
                const prevPage = helper.previousPage().getPage();
                helper.setPage(prevPage).search();
            }
        },

        
        getDOMStrings: function() {
            return DOMStrings;
        }

    }
})();


// Global controller
const controller = (function(UICtrl, dataCtrl) {

    // Get user location and set as query param
    const successCallback = (position) => {
        helper.setQueryParameter('aroundLatLng', `${position.coords.latitude},${position.coords.longitude}`);
      };
      
      const errorCallback = (error) => {
        console.log(error);
      };
      
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);



    const setUpEventListeners = ()  => {

        const DOM = UICtrl.getDOMStrings();

        // Run query on pageload
        document.addEventListener("DOMContentLoaded", initialSearch);

        // For logging queries
        document.querySelector(DOM.searchInput).addEventListener('keyup', logQuery);

        // For updating facetList when facet selected
        document.querySelector(DOM.facetsArea).addEventListener('click', controlFacets);
        
        // For pagination
        document.querySelector(DOM.pagination).addEventListener('click', controlPagination);

        // For sorting
        document.querySelector(DOM.sorting).addEventListener('change', updateSort);

        // When Algolia returns hits
        helper.on('result', function(event) {
            UICtrl.renderHits(event.results);
            UICtrl.renderMetadata(event.results);
            UICtrl.renderFacetList(event.results);
            UICtrl.renderPagination(event.results);
            dataCtrl.updatePageNum(event.results);
        })
    }

    const initialSearch = ()  => {
        helper.search();
    }

    const logQuery = (e) => {
        helper.setQuery(e.target.value).search();
    }

    const controlFacets = (e) => {
        UICtrl.updateFacets(e);
    }

    const controlPagination = (e) => {
        const pages = dataCtrl.currentPageNum();
        UICtrl.updatePages(e,pages);
    }

    const updateSort = (e) => {
        helper.setIndex(e.target.value).search();
    } 

    return {
        init: function() {
            setUpEventListeners();
        }
    }


})(interfaceController, dataController);


controller.init();