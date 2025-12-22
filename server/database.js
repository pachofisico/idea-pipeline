const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: './server.env' });

const sequelize = new Sequelize(
    process.env.DB_NAME || 'ideadb',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false,
    }
);

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true
    }
});

const Idea = sequelize.define('Idea', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subtitle: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.TEXT,
    },
    sketch: {
        type: DataTypes.TEXT, // DataURL or JSON of the drawing
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    feasibility: {
        type: DataTypes.STRING,
    },
    impact: {
        type: DataTypes.STRING,
    },
    analysis: {
        type: DataTypes.TEXT,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'portafolio'
    },
    folder: {
        type: DataTypes.STRING,
        defaultValue: 'General'
    },
    isTrash: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    strategy: {
        type: DataTypes.STRING,
    },
    patentDraft: {
        type: DataTypes.TEXT,
    }
});

const Finding = sequelize.define('Finding', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
    },
    snippet: {
        type: DataTypes.TEXT,
    },
    url: {
        type: DataTypes.STRING,
    },
    source: {
        type: DataTypes.STRING,
    }
});

User.hasMany(Idea, { as: 'ideas', foreignKey: 'userId' });
Idea.belongsTo(User, { foreignKey: 'userId' });

Idea.hasMany(Finding, { as: 'findings', foreignKey: 'ideaId' });
Finding.belongsTo(Idea, { foreignKey: 'ideaId' });

const initDB = async (retries = 5) => {
    while (retries > 0) {
        try {
            await sequelize.authenticate();
            console.log('Database connected successfully.');
            await sequelize.sync({ alter: true });
            console.log('Database models synchronized.');

            let defaultUser = await User.findOne({ where: { name: 'Francisco Javier Martínez' } });
            if (!defaultUser) {
                defaultUser = await User.create({
                    name: 'Francisco Javier Martínez',
                    email: 'pachofisico@example.com'
                });
                console.log('Default user created.');
            }

            const count = await Idea.count();
            if (count === 0) {
                await Idea.bulkCreate([
                    {
                        userId: defaultUser.id,
                        title: 'Santuario de Mascotas',
                        description: 'Plataforma inteligente para la gestión de refugios y adopción centrada en el bienestar animal.',
                        status: 'portafolio',
                        score: 95,
                        analysis: 'Excelente nicho con alta carga emocional y oportunidad de suscripción.'
                    },
                    {
                        userId: defaultUser.id,
                        title: 'Electrodoctor',
                        description: 'Sistema de diagnóstico remoto para dispositivos electrónicos mediante IA.',
                        status: 'portafolio',
                        score: 92,
                        analysis: 'Resuelve un problema real de soporte técnico descentralizado.'
                    },
                    {
                        userId: defaultUser.id,
                        title: 'Libro Inteligente',
                        description: 'Libros físicos que interactúan con realidad aumentada para mejorar el aprendizaje.',
                        status: 'portafolio',
                        score: 88,
                        analysis: 'Puente perfecto entre educación tradicional y tecnología.'
                    }
                ]);
                console.log('Initial ideas seeded.');
            }
            return; // Success
        } catch (error) {
            retries--;
            console.error(`Database connection failed. Retrying... (${retries} attempts left)`);
            console.error(error);
            await new Promise(res => setTimeout(res, 5000)); // Wait 5s
        }
    }
    console.error('Could not connect to database after several retries.');
};

module.exports = { sequelize, User, Idea, Finding, initDB };
