const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  UserController,
  PostController,
  CommentController,
  LikeController,
  FollowController,
} = require("../controllers");
const authenticateToken = require("../middleware/auth");

const uploadDestination = "uploads";
// Показываем, где хранить файлы, конфигурация
const storage = multer.diskStorage({
  destination: uploadDestination,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploads = multer({ storage: storage });

//routes users
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/current", authenticateToken, UserController.current);
router.get("/users/:id", authenticateToken, UserController.getUserById);
router.put(
  "/users/:id",
  authenticateToken,
  uploads.single("avatar"),
  UserController.updateUser
);

//routes posts
router.post("/posts", authenticateToken, PostController.createPost);
router.get("/posts", authenticateToken, PostController.getAllPosts);
router.get("/posts/:id", authenticateToken, PostController.getPostById);
router.delete("/posts/:id", authenticateToken, PostController.deletePost);

//routes comments
router.post("/comments", authenticateToken, CommentController.createComment);
router.delete(
  "/comments/:id",
  authenticateToken,
  CommentController.deleteComment
);

//routes like
router.post("/likes", authenticateToken, LikeController.likePost);
router.delete("/likes/:id", authenticateToken, LikeController.unlikePost);

//routes follow
router.post("/follow", authenticateToken, FollowController.followUser);
router.delete("/follow/:id", authenticateToken, FollowController.unfollowUser);

module.exports = router;
