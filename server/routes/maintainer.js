const express = require('express')
const router  = express.Router()
const maintainerController = require('../controllers/maintainerCont')

router.post('/signup', maintainerController.signup)
router.post('/login', maintainerController.login)

module.exports = router
