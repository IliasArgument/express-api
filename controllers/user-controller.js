const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs");
const Jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Fields are required!" });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      console.log(1);

      if (existingUser) {
        return res.status(400).json({ error: "User is Exist" });
      }
      console.log(2);
      const hashedPassword = await bcrypt.hash(password, 10);
      //user avatar config
      const png = Jdenticon.toPng(name, 200);
      const avatarName = `${name}_${Date.now()}.png`;
      const avatarPath = path.join(__dirname, "/../uploads", avatarName);
      fs.writeFileSync(avatarPath, png);
      console.log(3);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarName}`,
        },
      });

      console.log(4);

      res.json(user);
    } catch (error) {
      console.error("Error in register", error);
      //ощибку на клиент вернем
      res.status(500).json({ error: "Internal server error" });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Все поля обязательны!" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({ error: "Неверный логин или пароль!" });
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return res.status(400).json({ error: "Неверный логин или пароль!" });
      }
      // генерируем JWT, здесь мы шифруем id пользователя
      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);

      res.json({ token });
    } catch (error) {
      console.error("Login error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true,
        },
      });
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден!" });
      }
      // Этот участок кода выполняет проверку, следует ли один пользователь за другим, и возвращает данные о пользователе с добавлением информации о подписке. Давайте разберем его подробнее.
      const isFollowing = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId: id }],
        },
      });
      res.json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (error) {
      console.error("Get current Error", error);

      res.status(500).json({ error: "Internal server error!" });
    }
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;

    let filePath;
    // multer делает работу с файлом добавляет ее
    if (req.file && req.file.path) {
      filePath = req.file.path;
    }

    if (id !== req.user.userId) {
      return res.status(403).json({ error: "Нет доступа!" });
    }

    try {
      // если юзер обнов почту и уже есть такая у другого юзера отдаем ошибку
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: email,
          },
        });

        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "Почта уже используется!" });
        }
      }
      // тут undefined не перезапишет а оставит все как есть
      const user = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
        },
      });

      res.json(user);
    } catch (error) {
      console.error("Update user error!");
      res.status(500).json({ error: "Internal server error!" });
    }
  },
  current: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.userId,
        },
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });
      if (!user) {
        return res.status(400).json({ error: "Не удалось найти пользователя" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get Current Error");
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = UserController;
