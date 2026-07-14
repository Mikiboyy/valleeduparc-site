const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const users = [
    {
        username: 'admin',
        password: 'Admin123!',
        role: 'admin'
    },
    {
        username: 'evenement',
        password: 'Event123!',
        role: 'evenement'
    },
    {
        username: 'prix',
        password: 'Prix123!',
        role: 'prix'
    },
    {
        username: 'patrouille',
        password: 'Patrouille123!',
        role: 'patrouille'
    },
    {
        username: 'carriere',
        password: 'Carriere123!',
        role: 'carriere'
    }
];

async function seed() {
    try {
        await mongoose.connect('mongodb://127.0.0.1/valleeduparc');

        await Admin.deleteMany({});
        for (const user of users) {
            await Admin.create(user);
        }

        console.log('Utilisateurs admin créés avec succès.');
        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seed();