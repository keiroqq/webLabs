import { DataTypes, Model, Optional, ForeignKey } from 'sequelize';
import sequelize from '@config/db';
import User from './user';

type EventCategory = 'concert' | 'lecture' | 'exhibition';

export interface EventAttributes {
  id: number;
  title: string;
  description?: string | null;
  date: Date;
  category: EventCategory;
  createdBy: ForeignKey<User['id']>;
  createdAt?: Date;
  updatedAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventCreationAttributes
  extends Optional<
    EventAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'description'
  > {}

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - date
 *         - category
 *         - createdBy
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор мероприятия
 *         title:
 *           type: string
 *           description: Название мероприятия
 *         description:
 *           type: string
 *           nullable: true
 *           description: Описание мероприятия
 *         date:
 *           type: string
 *           format: date-time
 *           description: Дата проведения мероприятия
 *         createdBy:
 *           type: integer
 *           description: ID пользователя, создавшего мероприятие (Внешний ключ)
 *         category:
 *           $ref: '#/components/schemas/EventCategory'
 *         createdAt:
 *            type: string
 *            format: date-time
 *            description: Дата создания
 *         updatedAt:
 *            type: string
 *            format: date-time
 *            description: Дата последнего обновления
 *     EventCategory:
 *       type: string
 *       enum: [concert, lecture, exhibition]
 *       description: Категория мероприятия
 */

class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  public id!: number;
  public title!: string;
  public description!: string | null;
  public date!: Date;
  public category!: EventCategory;
  public createdBy!: ForeignKey<User['id']>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  // public static associate(models: any) {
  //   Event.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  // }
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('concert', 'lecture', 'exhibition'),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'events',
    timestamps: true,
    modelName: 'Event',
  },
);

export default Event;
