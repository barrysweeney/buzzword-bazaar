const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "./public/images/" });

const buzzword_controller = require("../controllers/buzzwordController");
const category_controller = require("../controllers/categoryController");

/// BUZZWORD ROUTES ///

// GET catalog home page
router.get("/", buzzword_controller.index);

// GET request for creating a buzzword
router.get("/buzzword/create", buzzword_controller.buzzword_create_get);

// POST request for creating a buzzword
router.post(
  "/buzzword/create",
  upload.single("img"),
  buzzword_controller.buzzword_create_post
);

// GET request for one buzzword
router.get("/buzzword/:id", buzzword_controller.buzzword_detail);

// GET request for list of all buzzwords
router.get("/buzzwords", buzzword_controller.buzzword_list);

// GET request to update buzzword
router.get("/buzzword/:id/update", buzzword_controller.buzzword_update_get);

// POST request to update buzzword
router.post(
  "/buzzword/:id/update",
  upload.single("img"),
  buzzword_controller.buzzword_update_post
);

// GET request to delete buzzword
router.get("/buzzword/:id/delete", buzzword_controller.buzzword_delete_get);

// POST request to delete buzzword
router.post("/buzzword/:id/delete", buzzword_controller.buzzword_delete_post);

/// CATEGORY ROUTES ///

// GET request for creating a category
router.get("/category/create", category_controller.category_create_get);

// POST request for creating a category
router.post("/category/create", category_controller.category_create_post);

// GET request for one category
router.get("/category/:id", category_controller.category_detail);

// GET request for list of all categories
router.get("/categories", category_controller.category_list);

// GET request to update category
router.get("/category/:id/update", category_controller.category_update_get);

// POST request to update category
router.post("/category/:id/update", category_controller.category_update_post);

// GET request to delete category
router.get("/category/:id/delete", category_controller.category_delete_get);

// POST request to delete category
router.post("/category/:id/delete", category_controller.category_delete_post);

module.exports = router;
