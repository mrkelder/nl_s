# Server for an online shop "New London"

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

