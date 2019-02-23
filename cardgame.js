const NUM_PROPERTIES = 3;

function buildDeck(data) {
    // Step 1: Get good property candidates.
    let propertiesCount = {};
    for (let line of data.results.bindings) {
        if (line.property.value in propertiesCount) {
            propertiesCount[line.property.value].count += 1;
        } else {
            propertiesCount[line.property.value] = {count: 1, id: line.property.value, label: line.propLabel.value};
        }
    }

    let propertiesSorted = [];

    for (const property in propertiesCount) {
        propertiesSorted.push([property, propertiesCount[property].count, propertiesCount[property].label]);
    }

    //propertiesSorted = propertiesSorted.sort((a,b) => b[1] - a[1]);
    propertiesSorted = propertiesSorted.sort((a,b) => Math.random());


    propertiesSorted = propertiesSorted.slice(0, NUM_PROPERTIES);
    console.log(propertiesSorted);

    // Step 2: Get items which have all these properties.
    let items = {};

    for (let line of data.results.bindings) {
        let valid = false;
        for (let property of propertiesSorted) {
            if (property[0] == line.property.value) {
                valid = true;
            }
        }

        if (valid) {
            let value = line.valueLabel.value;
            if (line.unitLabel && line.unitLabel.value != "1") {
                value += " "+line.unitLabel.value;
            }
            if (line.item.value in items) {
                items[line.item.value].properties.push({property: line.propLabel.value, value: value});
            } else {
                items[line.item.value] = {item: line.item.value, label: line.itemLabel.value, properties: [{property: line.propLabel.value, value: value}]};
            }
        }
    }

    let it = [];
    for (let item in items) {
        it.push(items[item]);
    }

    it = it.filter(item => item.properties.length == NUM_PROPERTIES);

    return it;
}

const query = `
SELECT ?item ?itemLabel ?image ?property ?propLabel ?valueLabel ?unitLabel WHERE {
  ?item wdt:P31/wdt:P279* wd:Q11344.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en,de". }
  ?item ?p ?statement.
  ?statement a wikibase:BestRank.

  ?property rdfs:label ?propLabel.
  ?property wikibase:claim ?p.
  ?property rdf:type wikibase:Property .

  FILTER (lang(?propLabel) = 'en' ).

  {
    ?property wikibase:propertyType wikibase:Quantity.

    ?statement ?psn ?valueNode.    
    ?valueNode wikibase:quantityAmount ?value.
    ?valueNode wikibase:quantityUnit ?unit.

    ?property wikibase:statementValue ?psn.
  } UNION {
    ?property wikibase:propertyType wikibase:Time.

    ?statement ?ps ?value.

    ?property wikibase:statementProperty ?ps.
  }
}
        `;
const url = `https://query.wikidata.org/bigdata/namespace/wdq/sparql?format=json&query=${query}`;
window.fetch(url).then(
    function (response) {
        if (response.status !== 200) {
            console.warn(`Looks like there was a problem. Status Code: ${response.status}`);
            return;
        }
        response.json().then(function (data) {
            var deck = buildDeck(data);

            for (let card of deck) {
                console.log(" ");
                console.log(card.label);
                for (let property of card.properties) {
                    console.log(property.property+": "+property.value);
                }
            }

        });
    }
).catch(function (err) {
    console.warn('Fetch Error :-S', err);
});