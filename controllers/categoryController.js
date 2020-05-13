const Category = require("../models/category");
const Buzzword = require("../models/buzzword");
const async = require("async");
const validator = require("express-validator");

// Display list of all categories.
exports.category_list = function (req, res) {
  Category.find()
    .populate("category")
    .sort([["name", "ascending"]])
    .exec(function (err, list_categories) {
      if (err) return next(err);
      res.render("category_list", {
        title: "Category List",
        category_list: list_categories,
      });
    });
};

// Display detail page for a specific Category.
exports.category_detail = function (req, res, next) {
  async.parallel(
    {
      category: function (callback) {
        Category.findById(req.params.id).exec(callback);
      },
      category_buzzwords: function (callback) {
        Buzzword.find({ category: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) return next(err);
      if (results.category === null) {
        // there are no results
        const err = new Error("Category not found");
        err.status = 404;
        return next(err);
      }

      res.render("category_detail", {
        title: "Category Detail",
        category: results.category,
        category_buzzwords: results.category_buzzwords,
      });
    }
  );
};

// Display Category create form on GET.
exports.category_create_get = function (req, res) {
  res.render("category_form", { title: "Create Category" });
};

// Handle Category create on POST.
exports.category_create_post = [
  // validate body field is not empty
  validator.body("name", "Category name required").trim().isLength({ min: 1 }),
  validator
    .body("description", "Description required")
    .trim()
    .isLength({ min: 1 }),

  // sanitize (escape) fields
  validator.sanitizeBody("*").escape(),

  // process request afetr validationa nd sanitization
  (req, res, next) => {
    // extract validation errors from request
    const errors = validator.validationResult(req);

    // create a category object with escaped and trimmed data
    const category = new Category({
      name: req.body.name,
      description: req.body.description,
    });

    if (!errors.isEmpty()) {
      // there are errors, render form again with sanitized values/ error messages
      res.render("category_form", {
        title: "Create Category",
        category: category,
        errors: errors.array(),
      });
      return;
    } else {
      // data from form is valid
      // check is Category with same name already exists
      Category.findOne({ name: req.body.name }).exec(function (
        err,
        found_category
      ) {
        if (err) {
          return next(err);
        }
        if (found_category) {
          // Category exists, redirect to its detail page
          res.redirect(found_category.url);
        } else {
          category.save(function (err) {
            if (err) {
              return next(err);
            }
            // category saved, redirect to category detail page
            res.redirect(category.url);
          });
        }
      });
    }
  },
];

// Display Category delete form on GET.
exports.category_delete_get = function (req, res, next) {
  async.parallel(
    {
      category: function (callback) {
        Category.findById(req.params.id).exec(callback);
      },
      categories_buzzwords: function (callback) {
        Buzzword.find({ category: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // if we got here then it has been succcessful so render
      res.render("category_delete", {
        title: "Delete Category",
        category: results.category,
        category_buzzwords: results.categories_buzzwords,
      });
    }
  );
};

// Handle Category delete on POST.
exports.category_delete_post = function (req, res, next) {
  async.parallel(
    {
      category: function (callback) {
        Category.findById(req.body.categoryid).exec(callback);
      },
      categories_buzzwords: function (callback) {
        Buzzword.find({ category: req.body.categoryid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.categories_buzzwords.length > 0) {
        // Category has buzzwords. Render in same way as for GET route.
        res.render("category_delete", {
          title: "Delete Category",
          category: results.category,
          category_buzzwords: results.categories_buzzwords,
        });
        return;
      } else {
        // Category has no buzzwords. Delete object and redirect to the list of categories.
        Category.findByIdAndRemove(req.body.categoryid, function deleteCategory(
          err
        ) {
          if (err) {
            return next(err);
          }
          // Success - go to category list
          res.redirect("/catalog/categories");
        });
      }
    }
  );
};

// Display Category update form on GET.
exports.category_update_get = function (req, res) {
  async.parallel(
    {
      category: function (callback) {
        Category.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.category === null) {
        const err = new Error("Category not found");
        err.status = 404;
        return next(err);
      }
      // succesful so render
      res.render("category_form", {
        title: "Update Category",
        category: results.category,
      });
    }
  );
};

// Handle Category update on POST.
exports.category_update_post = [
  // Validate fields.
  // validate body field is not empty
  validator.body("name", "Category name required").trim().isLength({ min: 1 }),
  validator
    .body("description", "Description required")
    .trim()
    .isLength({ min: 1 }),

  // sanitize (escape) fields
  validator.sanitizeBody("*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req);

    // Create a Category object with escaped/trimmed data and old id.
    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      _id: req.params.id, //This is required, or a new ID will be assigned
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      async.parallel(function (err, results) {
        if (err) {
          return next(err);
        }

        res.render("category_form", {
          title: "Update Category",
          category: category,
          errors: errors.array(),
        });
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Category.findByIdAndUpdate(req.params.id, category, {}, function (
        err,
        thecategory
      ) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to category detail page.
        res.redirect(thecategory.url);
      });
    }
  },
];
