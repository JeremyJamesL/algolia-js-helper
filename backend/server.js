import {ID, KEY} from '.modules/creds.js';
const algoliasearch = require('algoliasearch');
const client = algoliasearch(ID, KEY);
const index = client.initIndex('restaurants');
const csv = require ('csvtojson');

// Data paths

const csvFilePath = "data/restaurants_info.csv";
const dataJSON = require("./data/restaurants_list.json");


async function getProductData() {
    const jsonArray = await csv({delimiter:";"}).fromFile(csvFilePath);
    
    // Round star rating for filtering
    jsonArray.forEach(item => {
        const roundedRating = Math.round(item.stars_count);
        const newItem = { rounded_rating : roundedRating };
        Object.assign(item, newItem);
    });
    return jsonArray;   
}

async function main() {

    // Retrieve CSV to JSON datasets
    const dataCSV = await getProductData();

    // Save CSV to Algolia index
    index.saveObjects(dataCSV)
    .then(({objectIDs}) => {
        console.log('sucessfully added records');
        console.table(objectIDs);

        // Save JSON to Algolia as update
        index.partialUpdateObjects(dataJSON)
        .then(({objectIDs}) => {
            console.log('sucessfully updated records');
            console.table(objectIDs);
        })
        .catch(error => {
            console.error('Error when updating objects', error);
        })

    })
    .catch(error => {
        console.error('Error when indexing objects', error);
    })

}

main();