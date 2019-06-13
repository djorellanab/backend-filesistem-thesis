const express = require('express');
const api = express.Router();
const {verificarToken} = require('../../../middleware/authentication');
var uploadController = require('../../../controllers/upload');

api.post('/',[verificarToken], uploadController.post);
api.get('/:id',[verificarToken], uploadController.get);

module.exports = api;