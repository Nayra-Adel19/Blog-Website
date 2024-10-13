import express from "express";
import mongoose from "mongoose";
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import cors from "cors";
import admin from "firebase-admin";
import { v2 as cloudinary } from 'cloudinary';
import { readFile } from 'fs/promises';
import Blog from './Schema/Blog.js';

// Load service account key from JSON file
const serviceAccountKey = JSON.parse(await readFile(new URL('./react-js-duck-blog-firebase-adminsdk-jq9ct-0380317e4a.json',
    import.meta.url)));

import { getAuth } from "firebase-admin/auth";
import user from './Schema/User.js';

const server = express();
const PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
});

// Upload image endpoint
server.post("/upload", async(req, res) => {
    try {
        const fileStr = req.body.image;
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
        });
        console.log("Uploaded Image URL:", uploadResponse.secure_url);
        res.status(200).json({ url: uploadResponse.secure_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

const verifyJWT = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.status(401).json({ error: 'No access token' });
    }

    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {

        if (err) {
            return res.status(403).json({ error: 'Access token is invalid' });
        }

        req.user = user.id
        next()
    })
}

const formatDatatoSend = (user) => {
    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY);
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname
    };
};

const generateUsername = async(email) => {
    let username = email.split('@')[0];
    let isUsernameExists = await user.exists({ "personal_info.username": username }).then((result) => result);
    isUsernameExists ? username += nanoid().substring(0, 5) : "";
    return username;
};

server.post("/signup", async(req, res) => {
    const { fullname, email, password } = req.body;

    if (fullname.length < 3) {
        return res.status(403).json({ "error": "Your Full Name must be at least 3 letters long" });
    }
    if (!email.length) {
        return res.status(403).json({ "error": "Enter Email" });
    }
    if (!emailRegex.test(email)) {
        return res.status(403).json({ "error": "Email is invalid" });
    }
    if (!passwordRegex.test(password)) {
        return res.status(403).json({ "error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters" });
    }

    bcrypt.hash(password, 10, async(err, hashed_password) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        const username = await generateUsername(email);

        const newUser = new user({
            personal_info: { fullname, email, password: hashed_password, username }
        });

        try {
            const savedUser = await newUser.save();
            return res.status(200).json(formatDatatoSend(savedUser));
        } catch (err) {
            if (err.code === 11000) {
                return res.status(500).json({ "error": 'Email already exists' });
            }
            return res.status(500).json({ "error": err.message });
        }
    });
});

server.post("/signin", async(req, res) => {
    const { email, password } = req.body;

    try {
        const foundUser = await user.findOne({ 'personal_info.email': email });
        if (!foundUser) {
            return res.status(403).json({ "error": 'Email not found' });
        }

        if (!foundUser.google_auth) {
            const result = await bcrypt.compare(password, foundUser.personal_info.password);
            if (!result) {
                return res.status(403).json({ "error": 'Incorrect password' });
            } else {
                return res.status(200).json(formatDatatoSend(foundUser));
            }
        } else {
            return res.status(403).json({ "error": "Account was created using google. Try logging in with google." });
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ "error": err.message });
    }
});

server.post("/google-auth", async(req, res) => {
    const { access_token } = req.body;

    try {
        const decodedUser = await getAuth().verifyIdToken(access_token);
        const { email, name, picture } = decodedUser;

        let profilePicture = picture.replace("s96-c", "s384-c");

        let foundUser = await user.findOne({ 'personal_info.email': email }).select('personal_info.fullname personal_info.username personal_info.profile_img google_auth');
        if (foundUser) {
            if (!foundUser.google_auth) {
                return res.status(403).json({ "error": "This email was signed up without google. Please log in with password to access the account" });
            }
        } else {
            const username = await generateUsername(email);
            foundUser = new user({
                personal_info: { fullname: name, email, username, profile_img: profilePicture },
                google_auth: true
            });

            await foundUser.save();
        }

        return res.status(200).json(formatDatatoSend(foundUser));
    } catch (err) {
        return res.status(500).json({ "error": "Failed to authenticate you with google. Try with some other google account" });
    }
});

// Create Blog
server.post('/create-blog', verifyJWT, (req, res) => {

    let authorId = req.user;
    let { title, des, banner, tags, content, draft } = req.body;

    if (!title.length) {
        return res.status(403).json({ error: "You must provide a title to publish the blog" });
    }

    if (!des.length || des.length > 200) {
        return res.status(403).json({ error: "You must provide blog description under 200 characters" });
    }

    if (!banner.length) {
        return res.status(403).json({ error: "You must provide blog banner to publish it" });
    }

    if (!content.blocks.length) {
        return res.status(403).json({ error: "There must be some blog content to publish it" });
    }

    if (!tags.length || tags.length > 10) {
        return res.status(403).json({ error: "Provide tags in order to publish the blog, Maximum 10" });
    }

    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = title.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, "-").trim() + nanoid();

    let blog = new Blog({
        title,
        des,
        banner,
        content,
        tags,
        author: authorId,
        blog_id,
        draft: Boolean(draft)
    })

    blog.save().then(blog => {

        let incrementVal = draft ? 0 : 1;

        user.findOneAndUpdate({ _id: authorId }, { $inc: { "account_info.total_posts": incrementVal }, $push: { "blogs": blog._id } })
            .then(User => {
                return res.status(200).json({ id: blog.blog_id })
            })
            .catch(err => {
                return res.status(500).json({ error: "Failed to update total posts number" })
            })

    })

    .catch(err => {
        return res.status(500).json({ error: err.message })
    })

    //return res.json({ status: "Done" });

})

server.listen(PORT, () => {
    console.log('Listening on port -> ' + PORT);
});