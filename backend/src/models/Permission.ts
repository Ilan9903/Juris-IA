// src/models/Permission.ts

import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Supprime les espaces blancs inutiles
        uppercase: true, // Les noms de permissions seront en majuscules (ex: 'CAN_MANAGE_USERS')
    },
    description: {
        type: String,
        required: false, // La description est facultative
        trim: true,
    },
});

export default mongoose.model('Permission', permissionSchema);