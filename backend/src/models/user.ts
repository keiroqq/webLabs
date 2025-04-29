import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'createdAt'> {}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор пользователя
 *         name:
 *           type: string
 *           description: Имя пользователя
 *         email:
 *           type: string
 *           format: email
 *           description: Email пользователя (должен быть уникальным)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания пользователя
 */
class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public readonly createdAt!: Date;

  public async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    updatedAt: false,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const saltRounds = 10;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
    },
  },
);

export default User;
