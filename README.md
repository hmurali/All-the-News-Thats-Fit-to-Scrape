# All-the-News-Thats-Fit-to-Scrape
## Overview
The New York Times Scraper, a.k.a NYT Scraper, is a scraper app which captures the title, summary, and image of articles of the New York Times. In this app, users have a ability to save their favorite articles, add and edit notes to one or multiple articles. But that is not all, the app also provides a search feature, which allows users to search in titles according to different key words.

In this repository, you can see the source code of NYT Scraper.

## Key Dependencies
`cheerio`: scrapes front-end code from https://www.nytimes.com/section/world
`mongoose`: be in charge of database of `scrap`
`express`: builds server-side routes and functions
`morgan`: logs server-side requests, helps with debugging
`express-handlebars`: a powerful front-end builder without requiring multiple html pages
`axios`: similar to ajax; used for GET, and other requests.
