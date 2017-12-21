﻿// # C3 Searchable Table
// _A table of country data that is sortable, paginated, and searchable._

// Remember the column to specify sorting by it.
var gdp_column: c3.Table.Column<CountryData>;

// Keep track of the country we searched for
var match_country: CountryData;

// ## Create the Data Table

// Create a `c3.Table` object and set its options.  Bind to an **anchor** DOM element using a _string selector_.
var country_table: c3.Table<CountryData> = new c3.Table<CountryData>({
    anchor: '#country_table_example',

    // Enable the user to **sort** this table.
    sortable: true,

    // **Limit** the table to only show pages of 4 at a time,
    // and enable **pagination** to change pages.
    limit_rows: 10,
    pagination: true,

    // Make the table **searchable**
    searchable: true,

    // Create an array of **column** objects to describe the table columns.
    columns: [
        {
            header: { text: "Country" },
            cells: { html: (country) => '<b>' + country.name + '</b>' },
        }, {
            // These columns use custom formatters to set the html content of the cell 
            // adding commas, units, rounding, etc.  You can add raw HTML if you like.
            // These column also use the `vis` visualization support to render a bar
            // graph based on the cell value.
            header: { text: "Population" },
            cells: { text: (country) => d3.format(',')(country.population) },
            sort: (country) => country.population,
            vis: 'bar',
        }, {
            header: { text: "Urbanization" },
            cells: { text: (country) => country.urban_population.toFixed(1)+'%' },
            sort: (country) => country.urban_population,
            vis: 'bar',
            total_value: 100,
        }, {
            header: { text: "Land Area" },
            cells: { html: (country) => (d3.format(',')(Math.round(country.land_area))) + "km<sup>2</sup>" },
            sort: (country) => Math.round(country.land_area),
            vis: 'bar',
        },
        // Assign this column to a variable `gdp_column` so we can refer to it below for setting the default sort.
        gdp_column = {
            header: { text: "GDP" },
            cells: { text: (country) => "$" + (d3.format(',')(Math.round(country.gdp))) + "m" },
            sort: (country) => Math.round(country.gdp),
            vis: 'bar',
        }, {
            // By default, the `bar` visualization will base the bar width as a percentage of the
            // total value of all cells.  This isn't always appropriate, though, such as in the case
            // of GDP per capita.  So, here we manually set the `total_value` to be the maximum
            // per capita value.  Look out for Monaco!
            header: { text: "GDP per capita" },
            cells: { html: (country) => "$" + (d3.format(',')(Math.round(country.gdp_per_capita))) },
            sort: (country) => Math.round(country.gdp_per_capita),
            vis: 'bar',
            total_value: function () { return d3.max(country_table.data, (country) => country.gdp_per_capita); },
        },
    ],
    
    // Configure the initial column to **sort ** the data on based on the column varible `x_column` we created above.
    sort_column: gdp_column,

    // Style the row with class `match` if the country matches the one found in the search.
    // `match_country` is set in the match handler below.
    row_options: {
        classes: {
            'match': (country)=> country === match_country,
        },
    },

    // Add an **event handler** to highlight which row was found in a **search**
    handlers: {
        match: function(search, found_country, i) {
            match_country = found_country;
            this.redraw();
        },
    },
});


// ## Modify Table Options

// **Limit** the number of rows
document.querySelector('#limit_rows').addEventListener('change', function () {
    country_table.limit_rows = this.checked ?
        +(<HTMLInputElement>document.querySelector('#number_of_rows')).value : undefined;
    country_table.redraw();
});
document.querySelector('#number_of_rows').addEventListener('change', function () {
    country_table.limit_rows = (<HTMLInputElement>document.querySelector('#limit_rows')).checked ? 
        +this.value : undefined;
    country_table.redraw();
});

// Enable **pagination** to select a different page
document.querySelector('#pagination').addEventListener('change', function () {
    country_table.pagination = this.checked;
    country_table.redraw();
});

// Set how many pages are shown in the paginator
document.querySelector('#number_of_pages').addEventListener('change', function () {
    country_table.max_pages_in_paginator = +this.value;
    country_table.redraw();
});

// Allow table to be searchable if table isn't paginated
document.querySelector('#searchable_if_not_paginated').addEventListener('change', function () {
    country_table.searchable_if_not_paginated = this.checked;
    country_table.redraw();
});


// ## Load the Country Data

// The **interface** is just a type definition for TypeScript.
// Ignore this for JavaScript.
interface CountryData {
    name: string;
    code: string;
    population: number;
    urban_population: number;
    gdp: number;
    gdp_per_capita: number;
    land_area: number;
}
// Load the country **CSV data** using D3.
// This loads and merges the data from multiple tables.
// The data is loaded this way to work with the file format as provided by the World Bank data source.
d3.csv('data/countries.csv')
    .row((row) => ({
        name: row['name'],
        code: row['world_bank_code'],
    })).get((error, countries:CountryData[]) => {
        var country_lookup = {};
        countries.filter((row) => !!row.code).forEach((row) => {
            country_lookup[row.code] = row;
        });

        // Load the country data statistics for the year 2000
        // from the World Bank data format.
        d3.csv('data/gdp.csv')
            .row((row) => ({
                country_name: row['Country Name'],
                country_code: row['Country Code'],
                indicator: row['Indicator Code'],
                value: +row['Value'],
                year: +row['Year'],
            })).get((error, rows) => {
                var indicator_mapping = {
                    'SP.POP.TOTL': 'population',
                    'EN.URB.MCTY.TL.ZS': 'urban_population',
                    'AG.LND.TOTL.K2': 'land_area',
                    'NY.GDP.MKTP.CD': 'gdp',
                    'NY.GDP.PCAP.CD': 'gdp_per_capita',
                };
                for (let row of rows) {
                    if (!row.country_code) continue;
                    if (row.year !== 2000) continue;
                    if (!(row.indicator in indicator_mapping)) continue;
                    // Convert GDP to millions of dollars
                    if (indicator_mapping[row.indicator] === 'gdp') row.value /= 1000000;
                    country_lookup[row.country_code][indicator_mapping[row.indicator]] = row.value;
                }

                // Setup the table the **data** and **render**!
                d3.selectAll('#loading').remove();
                country_table.data = countries.filter((country) => country.gdp > 0.000000001);
                country_table.render();
            });
    });