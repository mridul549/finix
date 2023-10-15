const express = require('express')
const router  = express.Router()
const adminCont = require('../controllers/adminCont')

router.get('/profile', adminCont.getAdminProfile);

router.post('/signup', adminCont.signup)
router.post('/login', adminCont.login)

module.exports = router
