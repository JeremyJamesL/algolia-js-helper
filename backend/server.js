const algoliasearch = require('algoliasearch');
const client = algoliasearch('YSWWVAX5RB', '4203de3b08b981c149883b0af830db30');
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
        console.log('sucessfully added records with the following IDs:');
        console.table(objectIDs);
    })
    .catch(error => {
        console.error('Error when indexing objects', error);
    })

    // Update above records with additional data
    index.partialUpdateObjects(dataJSON)
    .then(({objectIDs}) => {
        console.log('sucessfully updated records with the following IDs:');
        console.table(objectIDs);
    })
    .catch(error => {
        console.error('Error when updating objects', error);
    })
}

main();