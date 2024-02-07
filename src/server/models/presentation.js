const { IntegrationInstructionsRounded } = require('@mui/icons-material')
const mongoose = require('mongoose')

const presentationSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    ques: [{
        index: Number,
        name: String,
        screen: Number,
        fileName: String
    }],

    files: [{
        name: String,
        url: String
    }]
})