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

// Load service account key from JSON file
const serviceAccountKey = JSON.parse(await readFile(new URL('./react-js-duck-blog-firebase-adminsdk-jq9ct-0380317e4a.json',
    import.meta.url)));

import { getAuth } from "firebase-admin/auth";
import user from './Schema/User.js';
import Blog from './Schema/Blog.js';
import Notification from './Schema/Notification.js';
import Comment from "./Schema/Comment.js";

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

// Change Password
server.post("/change-password", verifyJWT, async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Both current and new passwords are required" });
        }

        if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: "Password must be 6 to 20 characters long with at least one number, one lowercase letter, and one uppercase letter" });
        }

        const User = await user.findOne({ _id: req.user });
        if (!User) {
            return res.status(404).json({ error: "User not found" });
        }

        if (User.google_auth) {
            return res.status(403).json({ error: "You cannot change the password of an account logged in via Google" });
        }

        const isMatch = await bcrypt.compare(currentPassword, User.personal_info.password);
        if (!isMatch) {
            return res.status(403).json({ error: "Incorrect current password" });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: "New password must be different from the current password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await user.findOneAndUpdate({ _id: req.user }, { "personal_info.password": hashedPassword });

        return res.status(200).json({ status: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "An error occurred while changing the password. Please try again later." });
    }
});

// Latest Blogs
server.post('/latest-blogs', (req, res) => {

    let { page } = req.body;

    let maxLimit = 2;

    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

// All Latest Blogs Count
server.post("/all-latest-blogs-count", (req, res) => {

    Blog.countDocuments({ draft: false })
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            console.log(err.message)
            return res.status(500).json({ error: err.message })
        })
})

// Search Blogs Count
server.post("/search-blogs-count", (req, res) => {

    let { tag, query, author } = req.body;

    let findQuery;

    if (tag) {
        findQuery = { tags: tag, draft: false };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') };
    } else if (author) {
        findQuery = { author, draft: false };
    }

    Blog.countDocuments(findQuery)
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            console.log(err.message)
            return res.status(500).json({ error: err.message })
        })
})

// Trending Blogs
server.get('/trending-blogs', (req, res) => {

    Blog.find({ draft: false })
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "activity.total_reads": -1, "activity.total_likes": -1, "publishedAt": -1 })
        .select("blog_id title publishedAt -_id")
        .limit(5)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

// Search Blogs
server.post("/search-blogs", (req, res) => {

    let { tag, query, author, page, limit, eliminate_blog } = req.body;

    let findQuery;

    if (tag) {
        findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
    } else if (query) {
        findQuery = { draft: false, title: new RegExp(query, 'i') };
    } else if (author) {
        findQuery = { author, draft: false };
    }

    let maxLimit = limit ? limit : 2;

    Blog.find(findQuery)
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .sort({ "publishedAt": -1 })
        .select("blog_id title des banner activity tags publishedAt -_id")
        .skip((page - 1) * maxLimit)
        .limit(maxLimit)
        .then(blogs => {
            return res.status(200).json({ blogs })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

// Search Users
server.post('/search-users', (req, res) => {
    let { query } = req.body;

    user.find({ "personal_info.username": new RegExp(query, 'i') })
        .limit(50)
        .select("personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .then(users => {
            return res.status(200).json({ users })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

// Get Profile
server.post('/get-profile', (req, res) => {

    let { username } = req.body;

    user.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -updatedAt -blogs")
        .then(User => {
            return res.status(200).json(User)
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

// Update Profile Image
server.post('/update-profile-img', verifyJWT, (req, res) => {

    let { url } = req.body;

    user.findOneAndUpdate({ _id: req.user }, { "personal_info.profile_img": url })
        .then(() => {
            return res.status(200).json({ profile_img: url })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
})

// Update Profile
server.post('/update-profile', verifyJWT, (req, res) => {

    let { username, bio, social_links } = req.body;

    let bioLimit = 150;

    if (username.length < 3) {
        return res.status(403).json({ error: "Username should be at least 3 letters long" })
    }

    if (bio.length > bioLimit) {
        return res.status(403).json({ error: `Bio should not be more than ${bioLimit}` })
    }

    let socialLinksArr = Object.keys(social_links);

    try {

        for (let i = 0; i < socialLinksArr.length; i++) {
            if (social_links[socialLinksArr[i]].length) {
                let hostname = new URL(social_links[socialLinksArr[i]]).hostname;

                if (!hostname.includes(`${socialLinksArr[i]}.com`) && socialLinksArr[i] != 'website') {

                    return res.status(403).json({ error: `${socialLinksArr[i]} link is invalid.You must enter a full link` })

                }
            }
        }

    } catch (err) {
        return res.status(500).json({ error: "You must provide full social links with http(s) included" })
    }

    let updateObj = {
        "personal_info.username": username,
        "personal_info.bio": bio,
        social_links
    }

    user.findOneAndUpdate({ _id: req.user }, updateObj, {
            runValidators: true
        })
        .then(() => {
            return res.status(200).json({ username })
        })
        .catch(err => {
            if (err.code == 11000) {
                return res.status(409).json({ error: "username is already taken" })
            }
            return res.status(500).json({ error: err.message });
        })

})

// Create Blog
server.post('/create-blog', verifyJWT, (req, res) => {

    let authorId = req.user;
    let { title, des, banner, tags, content, draft, id } = req.body;

    if (!title.length) {
        return res.status(403).json({ error: "You must provide a title to publish the blog" });
    }

    if (!draft) {

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

    }

    tags = tags.map(tag => tag.toLowerCase());

    let blog_id = id || title.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, "-").trim() + nanoid();

    if (id) {
        Blog.findOneAndUpdate({ blog_id }, { title, des, banner, content, tags, draft: draft ? draft : false })
            .then(() => {
                return res.status(200).json({ id: blog_id });
            })
            .catch(err => {
                return res.status(500).json({ error: err.message });
            })
    } else {
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
    }
})

server.post('/get-blog', (req, res) => {
    let { blog_id, draft, mode } = req.body;
    let incrementVal = mode !== 'edit' ? 1 : 0;
    Blog.findOneAndUpdate({ blog_id }, { $inc: { "activity.total_reads": incrementVal } })
        .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
        .select("title des content banner activity publishedAt blog_id tags")
        .then(blog => {
            user.findOneAndUpdate({
                    "personal_info.username": blog.author.personal_info.username
                }, { $inc: { "account_info.total_reads": incrementVal } })
                .catch(err => {
                    return res.status(500).json({
                        error: err.message
                    })
                })

            if (blog.draft && !draft) {
                return res.status(500).json({
                    error: err.message
                });
            }
            return res.status(200).json({ blog });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        })
})

server.post("/like-blog", verifyJWT, (req, res) => {
    let user_id = req.user;
    let {
        _id,
        isLikedByUser
    } = req.body;
    let incrementVal = !isLikedByUser ? 1 : -1;
    Blog.findOneAndUpdate({ _id }, { $inc: { "activity.total_likes": incrementVal } })
        .then(blog => {
            if (!isLikedByUser) {
                let like = new Notification({
                    type: "like",
                    blog: _id,
                    notification_for: blog.author,
                    user: user_id
                })

                like.save().then(notification => {
                    return res.status(200).json({ liked_by_user: true })
                })
            } else {
                Notification.findOneAndUpdate({ user: user_id, type: "like", blog: _id })
                    .then(result => {
                        return res.status(200).json({ liked_by_user: false })
                    })
                    .catch(err => {
                        return res.status(500).json({ error: err.message })
                    })
            }
        });
});

server.post("/isliked-by-user", verifyJWT, (req, res) => {
    let user_id = req.user;
    let {
        _id
    } = req.body;
    Notification.exists({ user: user_id, type: "like", blog: _id })
        .then(result => {
            return res.status(200).json({ result })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
});

server.post("/add-comment", verifyJWT, (req, res) => {

    let user_id = req.user;

    let {
        _id,
        comment,
        blog_author,
        replying_to
    } = req.body;

    if (!comment.length) {
        return res.status(403).json({ error: 'Write something to leave a comment' });
    }

    let commentObj = { blog_id: _id, blog_author, comment, commented_by: user_id };

    if (replying_to) {
        commentObj.parent = replying_to;
    }

    new Comment(commentObj).save().then(async commentFile => {

        let { comment, commentedAt, children } = commentFile;

        Blog.findOneAndUpdate({ _id }, {
                $push: { "comments": commentFile._id },
                $inc: { "activity.total_comments": 1, "activity.total_parent_comments": replying_to ? 0 : 1 },
            })
            .then(blog => { console.log("New comment created") });

        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentFile._id
        }

        if (replying_to) {
            notificationObj.replied_on_comment = replying_to;

            await Comment.findOneAndUpdate({ _id: replying_to }, { $push: { children: commentFile._id } })
                .then(replyingToCommentDoc => { notificationObj.notification_for = replyingToCommentDoc.commented_by })
        }

        new Notification(notificationObj).save().then(notification => console.log('New notification created!'));

        return res.status(200).json({
            comment,
            commentedAt,
            _id: commentFile._id,
            user_id,
            children
        })
    })
});

server.post("/get-blog-comments", (req, res) => {
    let { blog_id, skip } = req.body;

    let maxLimit = 5;

    Comment.find({ blog_id, isReply: false })
        .populate("commented_by", "personal_info.fullname personal_info.profile_img")
        .skip(skip)
        .limit(maxLimit)
        .sort({
            "commentedAt": -1
        })
        .then(comment => {
            return res.status(200).json(comment);
        })
        .catch(err => {
            console.log(err.message);
            return res.status(500).json({ error: err.message });
        })
})

server.listen(PORT, () => {
    console.log('Listening on port -> ' + PORT);
});