const express = require('express')
const router  = express.Router()

router.use('/admin', require('./admin'))
router.use('/maintainer', require('./maintainer'))
router.use('/mail', require('../mail/mailRoutes'))

module.exports = router