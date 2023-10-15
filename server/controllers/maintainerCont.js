const Admin = require('../models/admin')
const Maintainer = require('../models/maintainer')
const mongoose   = require('mongoose');
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Queue      = require('bull');

const mailQueue = new Queue('mailQueue', {
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME
    }
})

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

module.exports.signup = (req,res) => {
    Maintainer.find({ email: req.body.email })
    .exec()
    .then(maintainer => {
        if(maintainer.length>=1) {
            const authMethod = maintainer[0].authMethod

            if(authMethod=="regular"){
                const verification = maintainer[0].verification
    
                if(!verification){
                    return res.status(409).json({
                        message: "Email already exits, log in and complete verfication"
                    })
                } 
                return res.status(409).json({
                    message: "Email already exits, try logging in."
                })
            } else {
                return res.status(409).json({
                    message: "This email is already registered with us, use a different login method."
                })
            }
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if(err){
                    return res.status(500).json({
                        error: err
                    })
                } else {
                    const maintainer = new Maintainer({
                        _id: new mongoose.Types.ObjectId,
                        maintainerName: req.body.maintainerName,
                        email: req.body.email,
                        password: hash,
                        authMethod: "regular"
                    })
                    maintainer
                    .save()
                    .then(async result => {
                        /**
                         * the role determines whether it's a admin or maintainer
                         * admin -> 1
                         * maintainer -> 2
                         */
                        const key = req.body.email
                        const role = 2
                        await mailQueue.add({ key, role })
                        return res.status(201).json({
                            action: "Role created and OTP Sent",
                            message: "Please check your mailbox for the OTP verification code."
                        })
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        })
                    })
                }
            })
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        })
    })
}

module.exports.login = (req,res) => {
    Maintainer.find({ email: req.body.email })
    .exec()
    .then(maintainer => {
        if(maintainer.length<1){
            return res.status(401).json({
                message: "Wrong email or password provided"
            })
        }
        const authMethod = maintainer[0].authMethod
        if(authMethod=="google"){
            return res.status(409).json({
                message: "Password is not set for this account. Login using some other method."
            })
        }
        const verification = maintainer[0].verification
        if(!verification) {
            return res.status(409).json({
                message: "Email is not verified, please complete verification"
            })
        }
        bcrypt.compare(req.body.password, maintainer[0].password, (err, result) => {
            if(err) {
                return res.status(401).json({
                    error: err
                })
            } 
            if(result) {
                const token = jwt.sign({
                    email: maintainer[0].email,
                    userid: maintainer[0]._id,
                    userName: maintainer[0].maintainerName,
                    profilePic: maintainer[0].profilePic,
                    role: maintainer[0].role
                }, process.env.TOKEN_SECRET, {
                    expiresIn: "30 days"
                })
                return res.status(200).json({
                    message: "Auth successful",
                    token: token
                })
            }
            return res.status(401).json({
                message: "Auth failed"
            })
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        })
    })
}

function getTokenForGoogleAuth (user,req,res) {
    const token = jwt.sign({
        email: user.email,
        maintainerid: user._id,
        maintainerName: user.userName,
    }, process.env.TOKEN_SECRET, {
        expiresIn: "30 days"
    })
    return res.status(200).json({
        message: "Auth successful",
        token: token
    })
}

module.exports.google_Login_Signup = (req,res) => {
    const email = req.body.email

    Maintainer.find({ email: email })
    .exec()
    .then(result => {
        // no maintainer found with same credentials- sign the maintainer up
        if(result.length==0){
            // TODO- Update or add the details in future which are recieved through google
            // update the profile pic too
            const maintainer = new Maintainer({
                _id: new mongoose.Types.ObjectId,
                maintainerName: req.body.maintainerName,
                email: req.body.email,
                maintainerProfilePic: {
                    url: req.body.profileUrl
                },
                verification: true,
                authMethod: "google"
            })
            maintainer
            .save()
            .then(newMaintainer => {
                getTokenForGoogleAuth(newMaintainer,req,res)
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                })
            })
        } else {
            // Log the Maintainer in
            const authMethod = result[0].authMethod
            if(authMethod==='regular'){
                return res.status(400).json({
                    message: "Please use normal login"
                })
            }
            else {
                getTokenForGoogleAuth(result[0],req,res)
            }
        }
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({
            error: err
        })
    })
}

module.exports.getMaintainerProfile = (req,res) => {
    const maintaineremail = req.query.maintainermail

    Maintainer.find({ email: maintaineremail })
    .select('_id maintainerName email profilePic')
    .exec()
    .then(result => {
        if(result.length>0) {
            return res.status(201).json({
                user: result
            })
        } else {
            return res.status(404).json({
                error: "Maintainer not found"
            })
        }
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({
            error: err
        })
    })
}