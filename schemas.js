const express = require('express');
const Joi = require('joi');


module.exports.memeSchema = Joi.object({
    title: Joi.object().required(),
    img: Joi.object(),
    tags: Joi.object()
})


