const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const sequelize = require("./config/db");
const eventRoutes = require("./routes/events");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const swaggerDocs = require("./config/swagger");
const Event = require("./models/event");
const User = require("./models/user");
const BlacklistedToken = require("./models/blacklistedToken");
const morgan = require("morgan");
const passport = require("./config/passport");

dotenv.config();
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

const port = 3000;

swaggerDocs(app);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/events", eventRoutes);

User.hasMany(Event, { foreignKey: "createdBy" });
Event.belongsTo(User, { foreignKey: "createdBy" });

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("База данных синхронизирована.");
    return sequelize.authenticate();
  })
  .then(() => {
     console.log("Подключение к базе данных установлено.");
     app.listen(port, () => {
       console.log(`Сервер запущен на порту ${port}`);
     });
  })
  .catch((err) => {
    console.error("Ошибка при инициализации приложения:", err);
  });