import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@config/db';

interface BlacklistedTokenAttributes {
  id: number;
  token: string;
  expiresAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface BlacklistedTokenCreationAttributes
  extends Optional<BlacklistedTokenAttributes, 'id'> {}

class BlacklistedToken
  extends Model<BlacklistedTokenAttributes, BlacklistedTokenCreationAttributes>
  implements BlacklistedTokenAttributes
{
  public id!: number;
  public token!: string;
  public expiresAt!: Date;
}

BlacklistedToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'blacklisted_tokens',
    timestamps: false,
    modelName: 'BlacklistedToken',
  },
);

export default BlacklistedToken;
