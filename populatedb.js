#! /usr/bin/env node

// Get arguments passed on command line
var userArgs = process.argv.slice(2);

const async = require("async");
const Buzzword = require("./models/buzzword");
const Category = require("./models/category");

const mongoose = require("mongoose");
const mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

let buzzwords = [];
let categories = [];

function buzzwordCreate(name, description, price, numberInStock, category, cb) {
  buzzworddetail = { name, description, price, numberInStock };
  if (category !== null) {
    buzzworddetail.category = category;
  }

  const buzzword = new Buzzword(buzzworddetail);

  buzzword.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Buzzword: " + buzzword);
    buzzwords.push(buzzword);
    cb(null, buzzword);
  });
}

function categoryCreate(name, description, cb) {
  const category = new Category({ name: name, description: description });

  category.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Category: " + category);
    categories.push(category);
    cb(null, category);
  });
}

function createCategories(cb) {
  async.series(
    [
      function (callback) {
        categoryCreate("Languages", "There are so many", callback);
      },
      function (callback) {
        categoryCreate("Frameworks", "REACT!", callback);
      },
    ],
    // optional callback
    cb
  );
}

function createBuzzwords(cb) {
  async.parallel(
    [
      function (callback) {
        buzzwordCreate(
          "Rust",
          "A dark horse?",
          10,
          100,
          categories[0],
          callback
        );
      },

      function (callback) {
        buzzwordCreate(
          "GoLang",
          "Something about Google?",
          10,
          110,
          categories[0],
          callback
        );
      },
      function (callback) {
        buzzwordCreate(
          "React",
          "Something about Facebook?",
          101,
          1110,
          categories[1],
          callback
        );
      },
    ],
    // optional callback
    cb
  );
}

async.series(
  [createCategories, createBuzzwords],
  // Optional callback
  function (err, results) {
    if (err) {
      console.log("FINAL ERR: " + err);
    } else {
      console.log("Buzzwords: " + buzzwords);
    }
    // All done, disconnect from database
    mongoose.connection.close();
  }
);
