import express from "express";
import mongoose from "mongoose";
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from "cors";
import admin from "firebase-admin";

import { readFile } from 'fs/promises';

// Load service account key from JSON file
const serviceAccountKey = JSON.parse(await readFile(new URL('./react-js-duck-blog-firebase-adminsdk-jq9ct-0380317e4a.json',
    import.meta.url)));

// import serviceAccountKey from './react-js-duck-blog-firebase-adminsdk-jq9ct-0380317e4a.json' assert { type: 'json' };


import { getAuth } from "firebase-admin/auth";


// Schema below
import user from './Schema/User.js';

const server = express();
let PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
})


const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY);

    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    };
}


const generateUsername = async(email) => {
    let username = email.split('@')[0];

    let isUsernameExists = await user.exists({ "personal_info.username": username }).then((result) => result)

    isUsernameExists ? username += nanoid().substring(0, 5) : "";

    return username;

}

server.post("/signup", (req, res) => {

    let { fullname, email, password } = req.body;

    if (fullname.length < 3) {
        return res.status(403).json({ "error": "Your Full Name must be at least 3 letters long" })
    }
    if (!email.length) {
        return res.status(403).json({ "error": "Enter Email" })
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "Email is invalid" })
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" })
    }

    bcrypt.hash(password, 10, async(err, hashed_password) => {

        let username = await generateUsername(email);

        let User = new user({
            personal_info: { fullname, email, password: hashed_password, username }
        })

        User.save().then((u) => {
                return res.status(200).json(formatDatatoSend(u));
            })
            .catch(err => {

                if (err.code == 11000) {
                    return res.status(500).json({ "error": 'Email already exists' });
                }
                return res.status(500).json({ "error": err.message });
            })
    })

})


server.post("/signin", (req, res) => {

    let { email, password } = req.body;

    user.findOne({ 'personal_info.email': email })
        .then((user) => {
            if (!user) {
                return res.status(403).json({ "error": 'Email not found' });
            }

            if (!user.google_auth) {

                bcrypt.compare(password, user.personal_info.password, (err, result) => {
                    if (err) {
                        return res.status(403).json({ "error": 'Error occurred while login please try again' });
                    }

                    if (!result) {
                        return res.status(403).json({ "error": 'Incorrect password' });
                    } else {
                        return res.status(200).json(formatDatatoSend(user));
                    }
                })

            } else {
                return res.status(403).json({ "error": "Account was created using google. Try logging in with google." })
            }


            //return res.json({ status: 'got user document' });
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ "error": err.message });
        });
})


server.post("/google-auth", async(req, res) => {

    let { access_token } = req.body;

    getAuth()
        .verifyIdToken(access_token)
        .then(async(decodedUser) => {


            let { email, name, picture } = decodedUser;

            picture = picture.replace("s96-c", "s384-c");

            // User
            let User = await user.findOne({
                    'personal_info.email': email
                }).select('personal_info.fullname personal_info.username personal_info.profile_img google_auth').then((u) => {
                    return u || null
                })
                .catch(err => {
                    return res.status(500).json({
                        "error": err.message
                    })
                })

            if (User) { // Login
                if (!User.google_auth) {
                    return res.status(403).json({ "error": "This email was signed up without google. Please log in with password to access the account" })
                }
            } else { // Sign up
                let username = await generateUsername(email);

                User = new user({
                    personal_info: { fullname: name, email, username },
                    google_auth: true
                })

                await User.save().then((u) => {
                        User = u
                    })
                    .catch(err => {
                        return res.status(500).json({ "error": err.message })
                    })
            }

            return res.status(200).json(formatDatatoSend(User))

        })
        .catch(err => {
            return res.status(500).json({ "error": "Failed to authenticate you with google. Try with some other google account" })
        })
})


server.listen(PORT, () => {
    console.log('listening on port -> ' + PORT);
})