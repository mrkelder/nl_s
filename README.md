# Server for an online shop "New London"

## Version 0.5.0

This project is the online shop that's called "New London". Actually I've already tried to make it before ,
but because of some crash everything was destroyed and therefore lost (I'm talking about a database). Then I decided
to write the same project , but using react and separeted server instead of rewriting that lost version again.

[Here you can access client verions](https://github.com/mrkelder/nl)

## Preparation

For this project you'll need to:

1) Install all dependencies **npm i**
2) Run project with **node app**

## Hierarchy

Here you can examine the hierarchy of this application

```
project
│   README.md
│   .gitignore
│   package.json
│   package-lock.json
│   app.js - major file
│   .env - env file with a telegram token
│
└───node_modules
│
└───static - folder for static files
│
└───server
    │ route.js - file , that serves routes

```

## Decorations

All the decorations used in this project

### mongodb

Takes place in **app.js**.
Works with a mongodb library. Takes a function as an argument. Function looks like that.

```
const obj = {
  mongodb - mongodb object,
  client - client object,
  db - current db (NL)
};

fastify.mongodb( (obj) => {} )
```

## Server folder

### route.js

Takes place in **server/route.js**.

Serves routes of the project.

#### GET

1) /callMeBack - serves call me back logic and sends message to a telegram chat *(requires number query)*
2) /getCatalog - sends catalog that it takes from a server
```
[
  {
    img: 'image.png',
    items: [
      {
        name : {
          ru: 'ru',
          ua: 'ua'
        },
        link: '/link',
        companies: [
          {
            link: 'apple',
            name: 'Apple',
            _id: 'fh2iu27eufhsi8edu7e3'
          },
          ...
        ]
      },
      ...
    ],
    link: '/link',
    name: {
      ru: 'ru',
      ua: 'ua'
    },
    _id: '4k1h2kji12uy3412'
  },
  ...
]
```
3) /getSlides - retrieves slides for a slider in Main page
```
{
  slides: [
    {
      mobile: 'someImage.png',
      pc: 'anotherOne.png'
    },
    ...
  ]
}
```
4) /getTopItems - retrieves top items from the server
```
[
  {
    _id: '2f2sdf2112eef',
    name: 'iPhone',
    properties: [
      {
        name: 'Стандарт связи',
        value: '4G'
      },
      ...
    ],
    themes:[
      {
        price: 999 999,
        main_photo: 'wddedwdae.jpg',
        photos: [
          'wddedwdae.jpg',
          ...
        ],
        color: '#000',
        rating: 4
      },
      ...
    ]
  },
  ...
]
```
5) /getBanners - retrieves banners
```
[
  {
    name: 'dsfadfsdfd.jpg',
    link: '/item/fiueuejfkefefuhef'
  },
  ...
]
```

6) /getProperties - receives the properties for some certain category of items (e.g. smarphones)
```
[
  {
    name: "Память",
    values: [
    "32Gb",
    ...
    ]
  },
  ...
  ]
```

7) /getShops - gives the shops for the google map
```
[
  {
    _id: 'f3n12ueb8bksncogk',
    name: {
      ru: 'dd',
      ua: 'di'
    },
    shops: [
      {
        _id: 'fh82hkxchseie',
        name: 'New London in dd',
        location: {
          type: 'Point',
          coordinates: [x , y]
        },
        work_time: [
          {
            day: {
              ru: 'Monday',
              ua: 'Mondai'
            },
            time: '7:00 - 18:00'
          },
          ...
        ]
      },
      ...
    ]
  },
  ...
]
```

8) /getCompaniesForStore - gives a list of companies that have devices connected with current category
```
[
  { 
    _id: 'nr83hofdjf8wefoiehf23oi',
    link: 'apple',
    name: 'Apple',
    items: [
      {
        name: '/smartphones',
        products: [
          'fff33f322e232f',
          ...
        ]
      },
      ...
    ]
  },
  ...
]
```

9) /getItems - retrieves items for shop
```
[
  {
    _id: 'fdsfdsfjeh23j24'
    brand: "5f02e1faf1dcd83abc2e972a",
    link: "smartphones",
    name: "iPhone 11",
    properties: [
      {
        name: 'dsd',
        value: 'fdfd'
      },
      ...
    ],
    themes: [
      {
        color: '#000',
        main_photo: 'fff.png',
        photos: [
          'fff.png',
          ...
        ],
        price: 2000,
        rating: 4
      },
      ...
    ]
  },
  ...
]

```