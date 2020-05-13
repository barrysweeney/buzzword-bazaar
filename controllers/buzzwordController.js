const Buzzword = require("../models/buzzword");
const Category = require("../models/category");
const expressValidator = require("express-validator");
const async = require("async");
const fs = require("fs");

exports.index = function (req, res) {
  async.parallel(
    {
      buzzword_count: function (callback) {
        Buzzword.countDocuments({}, callback);
      },
      category_count: function (callback) {
        Category.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Buzzword Bazaar Home",
        error: err,
        data: results,
      });
    }
  );
};

// display list of all buzzwords
exports.buzzword_list = function (req, res) {
  Buzzword.find({}, "name").exec(function (err, list_buzzwords) {
    if (err) return next(err);
    //successful if got here, so render:
    res.render("buzzword_list", {
      title: "Buzzword List",
      buzzword_list: list_buzzwords,
    });
  });
};

// Display detail page for a specific buzzword.
exports.buzzword_detail = function (req, res, next) {
  async.parallel(
    {
      buzzword: function (callback) {
        Buzzword.findById(req.params.id).populate("category").exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.buzzword === null) {
        // No results.
        const err = new Error("Buzzword not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.

      // only display image if the src is not an empty string
      const hasImg = results.buzzword.buzzwordImage.length > 0;

      res.render("buzzword_detail", {
        title: results.buzzword.name,
        buzzword: results.buzzword,
        hasImg: hasImg,
      });
    }
  );
};

// Display buzzword create form on GET.
exports.buzzword_create_get = function (req, res) {
  async.parallel(
    {
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("buzzword_form", {
        title: "Create Buzzword",
        categories: results.categories,
      });
    }
  );
};

// Handle buzzword create on POST.
exports.buzzword_create_post = [
  (req, res, next) => {
    // convert category to array
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") {
        req.body.category = [];
      } else {
        req.body.category = new Array(req.body.category);
      }
    }
    next();
  },
  // validate fields
  expressValidator
    .body("name", "Name must not be empty")
    .trim()
    .isLength({ min: 1 }),
  expressValidator
    .body("description", "Description must not be empty")
    .trim()
    .isLength({ min: 1 }),
  expressValidator
    .body("price", "Price should be a whole number and can't be negative")
    .isInt({ min: 0 }),
  expressValidator
    .body(
      "numberInStock",
      "Number in stock should be a whole number and can't be negative"
    )
    .isInt({ min: 1, max: 100 }),
  // sanitize fields (using wildcard)
  expressValidator.sanitizeBody("*").escape(),
  // process request after validation and sanitization
  (req, res, next) => {
    // extract validation errors from request
    const errors = expressValidator.validationResult(req);
    let imgToUpload;
    if (req.file && req.file.mimetype.startsWith("image")) {
      const imgData = fs.readFileSync(req.file.path);
      const imgContentType = req.file.mimetype;
      imgToUpload = { data: imgData, contentType: imgContentType };
    }

    let buzzword;
    // Create a buzzword object with escaped and trimmed data
    if (imgToUpload) {
      buzzword = new Buzzword({
        name: req.body.name,
        description: req.body.description,
        numberInStock: req.body.numberInStock,
        price: req.body.price,
        category: req.body.category,
        img: imgToUpload,
      });
    } else {
      buzzword = new Buzzword({
        name: req.body.name,
        description: req.body.description,
        numberInStock: req.body.numberInStock,
        price: req.body.price,
        category: req.body.category,
      });
    }

    if (!errors.isEmpty()) {
      // there are errors, render form again with values/error messages

      // get all categories for form
      async.parallel(
        {
          categories: function (callback) {
            Category.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }
          // mark our selected categories as checked
          for (let i = 0; i < results.categories.length; i++) {
            if (buzzword.category.indexOf(results.categories[i]._id) > -1) {
              results.categories[i].checked = "true";
            }
          }
          res.render("buzzword_form", {
            title: "Create Buzzword",
            categories: results.categories,
            buzzword: buzzword,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // data from form is valid. save buzzword
      buzzword.save(function (err) {
        // successful - redirect to new buzzword record
        res.redirect(buzzword.url);
      });
    }
  },
];

// Display buzzword delete form on GET.
exports.buzzword_delete_get = function (req, res, next) {
  async.parallel(
    {
      buzzword: function (callback) {
        Buzzword.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.buzzword === null) {
        res.redirect("/catalog/buzzwords");
      }
      // if we got here then it has been succcessful so render
      res.render("buzzword_delete", {
        title: "Delete Buzzword",
        buzzword: results.buzzword,
      });
    }
  );
};

// Handle buzzword delete on POST.
exports.buzzword_delete_post = function (req, res) {
  async.parallel(
    {
      buzzword: function (callback) {
        Buzzword.findById(req.body.buzzwordid).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (req.body.password === process.env.PASSWORD) {
        // Delete object and redirect to the list of buzzwords.
        Buzzword.findByIdAndRemove(req.body.buzzwordid, function deletebuzzword(
          err
        ) {
          if (err) {
            return next(err);
          }
          // Success - go to buzzword list
          res.redirect("/catalog/buzzwords");
        });
      }
    }
  );
};

// Display buzzword update form on GET.
exports.buzzword_update_get = function (req, res) {
  // get the buzzword, and categories for form
  async.parallel(
    {
      buzzword: function (callback) {
        Buzzword.findById(req.params.id).populate("category").exec(callback);
      },
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.buzzword === null) {
        const err = new Error("Buzzword not found");
        err.status = 404;
        return next(err);
      }
      // successful so mark selected categories as checked
      for (
        let all_c_iter = 0;
        all_c_iter < results.categories.length;
        all_c_iter++
      ) {
        for (
          let buzzword_c_iter = 0;
          buzzword_c_iter < results.buzzword.category.length;
          buzzword_c_iter++
        ) {
          if (
            results.categories[all_c_iter]._id.toString() ===
            results.buzzword.category[buzzword_c_iter]._id.toString()
          ) {
            results.categories[all_c_iter].checked = true;
          }
        }
      }
      res.render("buzzword_form", {
        title: "Update buzzword",
        categories: results.categories,
        buzzword: results.buzzword,
        passwordRequired: true,
      });
    }
  );
};

// Handle buzzword update on POST.
exports.buzzword_update_post = [
  // Convert the category to an array
  (req, res, next) => {
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") req.body.category = [];
      else req.body.category = new Array(req.body.category);
    }
    next();
  },

  // Validate fields.
  // validate fields
  expressValidator
    .body("name", "Name must not be empty")
    .trim()
    .isLength({ min: 1 }),
  expressValidator
    .body("description", "Description must not be empty")
    .trim()
    .isLength({ min: 1 }),
  expressValidator
    .body("price", "Price should be a whole number and can't be negative")
    .isInt({ min: 0 }),
  expressValidator
    .body(
      "numberInStock",
      "Number in stock should be a whole number and can't be negative"
    )
    .isInt({ min: 1, max: 100 }),
  expressValidator
    .body("password", "Invalid password")
    .matches(process.env.PASSWORD),

  // sanitize fields (using wildcard)
  expressValidator.sanitizeBody("*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = expressValidator.validationResult(req);

    let imgToUpload;
    if (req.file && req.file.mimetype.startsWith("image")) {
      const imgData = fs.readFileSync(req.file.path);
      const imgContentType = req.file.mimetype;
      imgToUpload = { data: imgData, contentType: imgContentType };
    }

    // Create a buzzword object with escaped/trimmed data and old id.
    let buzzword;
    // Create a buzzword object with escaped and trimmed data
    if (imgToUpload) {
      buzzword = new Buzzword({
        name: req.body.name,
        description: req.body.description,
        numberInStock: req.body.numberInStock,
        price: req.body.price,
        img: imgToUpload,
        category:
          typeof req.body.category === "undefined" ? [] : req.body.category,
        _id: req.params.id,
      });
    } else {
      buzzword = new Buzzword({
        name: req.body.name,
        description: req.body.description,
        numberInStock: req.body.numberInStock,
        price: req.body.price,
        category:
          typeof req.body.category === "undefined" ? [] : req.body.category,
        _id: req.params.id,
      });
    }

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all categories for form.
      async.parallel(
        {
          categories: function (callback) {
            Category.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected categories as checked.
          for (let i = 0; i < results.categories.length; i++) {
            if (buzzword.category.indexOf(results.categories[i]._id) > -1) {
              results.categories[i].checked = "true";
            }
          }
          res.render("buzzword_form", {
            title: "Update buzzword",
            categories: results.categories,
            buzzword: buzzword,
            errors: errors.array(),
            passwordRequired: true,
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record.
      Buzzword.findByIdAndUpdate(req.params.id, buzzword, {}, function (
        err,
        thebuzzword
      ) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to buzzword detail page.
        res.redirect(thebuzzword.url);
      });
    }
  },
];
