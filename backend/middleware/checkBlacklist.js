const BlacklistedToken = require("../models/blacklistedToken");

const checkBlacklist = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const blacklisted = await BlacklistedToken.findOne({
      where: { token: token },
    });

    if (blacklisted) {
      return res
        .status(401)
        .json({ message: "Доступ запрещен: токен аннулирован" });
    }

    next();
  } catch (error) {
    console.error("Ошибка при проверке черного списка токенов:", error);
    res.status(500).json({ message: "Ошибка сервера при проверке токена" });
  }
};

module.exports = checkBlacklist;
