// src/models/eventParticipant.ts
import { DataTypes, Model, ForeignKey } from 'sequelize';
import sequelize from '@config/db';
import User from './user';
import Event from './event';

interface EventParticipantAttributes {
  userId: ForeignKey<User['id']>;
  eventId: ForeignKey<Event['id']>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EventParticipantCreationAttributes
  extends EventParticipantAttributes {}

class EventParticipant
  extends Model<EventParticipantAttributes, EventParticipantCreationAttributes>
  implements EventParticipantAttributes
{
  public userId!: ForeignKey<User['id']>;
  public eventId!: ForeignKey<Event['id']>;
}

EventParticipant.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      primaryKey: true,
      allowNull: false,
      onDelete: 'CASCADE',
    },
    eventId: {
      type: DataTypes.INTEGER,
      references: {
        model: Event,
        key: 'id',
      },
      primaryKey: true,
      allowNull: false,
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'event_participants',
    timestamps: true,
    updatedAt: false,
    modelName: 'EventParticipant',
  },
);

export default EventParticipant;
