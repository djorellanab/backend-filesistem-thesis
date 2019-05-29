'use strict'

const {HttpError} = require('../resources/error');
const {FunctionalMovement} = require('../schemas/functional-movement');
const {File} = require('../schemas/file');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const path = require('path');
const extensionesValidations = ['gbd'];
module.exports = {
    post: (req, res, next) =>{
        if(!req.files){return next (HttpError.BadRequest); }
        
        let data = req.files.file;
        let id = req.files.id;
        let guid = uuidv1();

        let name = data.name.split('.');
        let extension = name[name.length-1];
        
        name.pop();
        name = name.join('-');

        if(extensionesValidations.indexOf(extension) < 0) {return next (new HttpError(400,'the extensions permitted are: ' + extensionesValidations.join(',')));}
        
        let pathImage = 'uploads';
        let absolutePath = path.resolve(__dirname,`../${pathImage}/${guid}.${extension}`);
        
        data.mv(`${pathImage}/${guid}.${extension}`, (err) =>{
            if (err){return next (new HttpError(500, JSON.stringify(err))); }
            var date = new Date();
            let file = new File({
                name,
                guid,
                extension,
                path:pathImage,
                time_stamp: date.getDate(),
                time_stamp_hour: date.getHours()
            });
            file.save((err, fileDB) => {
                if (err){
                    if(path.existsSync(absolutePath)){
                        fs.unlinkSync(absolutePath);
                    }
                    return next (HttpError.BadRequest);
                }
                FunctionalMovement.findByIdAndUpdate(id, {file:fileDB._id}, {new: true}, (err, fmDB) =>{
                    if (err){
                        File.findByIdAndUpdate(fileDB._id, {state: false}, {new: true}, (err, fileDB2) =>{
                            return next (HttpError.BadRequest);
                        });
                    } else if (data === null){
                        File.findByIdAndUpdate(fileDB._id, {state: false}, {new: true}, (err, fileDB2) =>{
                            return next (HttpError.NotFound);
                        });
                    }
                    res.json({
                        status: "success",
                        message: "Se ha cargado el archivo"
                    });
                });
            })
        })
    },
    get: (req, res, next) =>{
        let id = req.params.id;
        File.findById(id)
        .exec((err, data) =>{
            if(err) {return next (HttpError.BadRequest);}
            else if (data === null){return next (HttpError.NotFound);}
            let absolutePath = path.resolve(__dirname,`../${data.path}/${data.guid}.${data.extension}`);
            let _file = fs.createReadStream(absolutePath);
            var stat = fs.statSync(absolutePath);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename=${data.name}.${data.extension}`);
            _file.pipe(res);
        })
    }
}