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
    Admin.find({ email: req.body.email })
    .exec()
    .then(admin => {
        if(admin.length>=1) {
            const authMethod = admin[0].authMethod

            if(authMethod=="regular"){
                const verification = admin[0].verification
    
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
                    const admin = new Admin({
                        _id: new mongoose.Types.ObjectId,
                        adminName: req.body.adminName,
                        email: req.body.email,
                        password: hash,
                        authMethod: "regular"
                    })
                    admin
                    .save()
                    .then(async result => {
                        /**
                         * the role determines whether it's a admin or maintainer
                         * admin -> 1
                         * maintainer -> 2
                         */
                        const key = req.body.email
                        const role = 1
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
    Admin.find({ email: req.body.email })
    .exec()
    .then(admin => {
        if(admin.length<1){
            return res.status(401).json({
                message: "Wrong email or password provided"
            })
        }
        const authMethod = admin[0].authMethod
        if(authMethod=="google"){
            return res.status(409).json({
                message: "Password is not set for this account. Login using some other method."
            })
        }
        const verification = admin[0].verification
        if(!verification) {
            return res.status(409).json({
                message: "Email is not verified, please complete verification"
            })
        }
        bcrypt.compare(req.body.password, admin[0].password, (err, result) => {
            if(err) {
                return res.status(401).json({
                    error: err
                })
            } 
            if(result) {
                const token = jwt.sign({
                    email: admin[0].email,
                    userid: admin[0]._id,
                    userName: admin[0].adminName,
                    profilePic: admin[0].profilePic,
                    role: admin[0].role
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
        adminid: user._id,
        adminName: user.userName,
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

    Admin.find({ email: email })
    .exec()
    .then(result => {
        // no admin found with same credentials- sign the admin up
        if(result.length==0){
            // TODO- Update or add the details in future which are recieved through google
            // update the profile pic too
            const admin = new Admin({
                _id: new mongoose.Types.ObjectId,
                adminName: req.body.adminName,
                email: req.body.email,
                adminProfilePic: {
                    url: req.body.profileUrl
                },
                verification: true,
                authMethod: "google"
            })
            admin
            .save()
            .then(newAdmin => {
                getTokenForGoogleAuth(newAdmin,req,res)
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                })
            })
        } else {
            // Log the Admin in
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

module.exports.getAdminProfile = (req,res) => {
    const adminemail = req.query.adminmail

    Admin.find({ email: adminemail })
    .select('_id adminName email outlets profilePic')
    .exec()
    .then(result => {
        if(result.length>0) {
            return res.status(201).json({
                user: result
            })
        } else {
            return res.status(404).json({
                error: "Admin not found"
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