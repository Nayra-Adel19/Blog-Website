# DUCK Blog Website

![Logo](./frontend/src/imgs/duckFullLogo.png)

![Slogan](https://readme-typing-svg.herokuapp.com/?font=Lemon&size=30&color=242424&center=true&vCenter=true&width=890&lines=Quack+Your+Way+to+Success!+🌠+Portfolio+Project%F0%9F%92%BB)

Welcome to Our Blog Website!👋 DUCK is a full-featured blog platform with a user-friendly interface built for creating and managing blog posts. It enables users to create, edit, and delete blogs, comment on posts, reply to comments, save drafts, edit profiles, manage notifications, and track their posts' engagement. DUCK also features a responsive design, ensuring accessibility across devices, and includes optional functionality for enhanced writing through a markdown editor.

---

## `Features` 🎯

- **User Authentication:**
  - Secure user registration and login using Firebase authentication.
  - Password reset functionality.
  - Ability to change passwords.

- **Blog Management:**
  - **Create:** Users can write and publish blog posts with a rich text editor.
  - **Edit:** Update content of published blog posts.
  - **Delete:** Remove blog posts from the platform.
  - **Drafts:** Save blog drafts for future editing and publishing.

- **Interaction:**
  - **Comments:** Users can leave comments on blog posts.
  - **Replies:** Reply to existing comments with a threaded format.
  - **Likes:** Ability to like/unlike blog posts.
  - **Notifications:** Alerts for new comments, likes, replies, and other activities.

- **User Profile:**
  - **Edit Profile:** Update username, bio, social links, and profile picture.
  - **Dashboard:** A personal space displaying all user blogs with statistics on likes, comments, and reads.

- **Search:**
  - **Search Bar:** Search functionality for finding blogs or users.

- **Additional Features:**
  - **404 Page:** Custom "Page Not Found" for unmatched routes.
  - **Responsive Design:** Optimized for mobile, tablet, and desktop.
  - **Markdown Editor:** Allows users to write blog content using markdown syntax.
  - **Header Image Upload:** Users can add a header image to their blog posts.

---

## `Technologies Used` 🚀

The **`DUCK Blog Website`** utilizes the **`MERN Stack`**, incorporating the following technologies:

![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?style=for-the-badge&logo=MongoDB&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-339933.svg?style=for-the-badge&logo=Node%2Ejs&logoColor=white)

### **Frontend**

- React
- Tailwind CSS
- PostCSS
- Vite

### **Backend**

- Node.js
- Express.js
- MongoDB
- Firebase (*Google Authentication*)
- Cloudinary (*image storage*)

### **Tools**

- requests.rest (*API Testing*)

---

## `Demo` 🎬

### Check out the Video Demo of DUCK Blog Website [here](https://www.youtube.com)

---

## `Installation & Setup` 📌

To run the **`DUCK Blog Website`** locally, follow these steps:

Before proceeding, ensure you have [NodeJS](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your system.

1. Create and navigate to a directory for the project:

```bash
mkdir Blog-Website
cd Blog-Website
```

2. Clone the repository:

```bash
git clone https://github.com/Nayra-Adel19/Blog-Website.git
```

3. Navigate to the project directory:

```bash
cd Blog-Website
```

4. Navigate to the server directory and install server dependencies:

```bash
cd server
npm install
```

5. Navigate to the frontend directory and install frontend dependencies:

```bash
cd frontend
npm install
```

6. Create a `.env` file in the server directory and set the following environment variables:

   - For MongoDB connection and authentication:

   ```plaintext
   DB_LOCATION=your-mongodb-connection-string
   SECRET_ACCESS_KEY=your-jwt-secret
   ```

   - For Cloudinary integration:

   ```plaintext
   CLOUDINARY_UPLOAD_PRESET=cloudinary-upload-preset
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

	 - Don't forget to create a new file in the server for `firebase admin SDK`, your file should created by this extinction `.json`

7. Create a `.env` file in the frontend directory and set the following environment variables:

   - For Frontend and server communicate with each other:

   ```plaintext
   VITE_SERVER_DOMAIN=your-server-domain
   ```

   - For Firebase integration:

   ```plaintext
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-firebase-app-id
   ```

   - For Cloudinary integration:

   ```plaintext
   VITE_IMAGE_PRESET_KEY=your-cloudinary-upload-preset
   VITE_IMAGE_CLOUD_NAME=your-cloudinary-cloud-name
   ```

8. Start the server from the Blog-Website directory:

```bash
cd server
npm start
```

1. Start the frontend from the Blog-Website directory:

```bash
cd frontend
npm run dev
```

Ensure to replace the placeholder values (`your-mongodb-connection-string`, `your-jwt-secret`, etc.) with your actual values specific to your environment and setup.

---

## `API Endpoints` 💫

### **Authentication**

- **Register:** POST /server/domain/signup
- **Login:** POST /server/domain/signin
- **Google Auth:** POST /server/domain/google-auth
- **Change Password:** POST /server/domain/change-password

### **Blog Management**

- **Get Latest Blogs:** POST /server/domain/latest-blogs
- **Create Blog:** POST /server/domain/create-blog
- **Delete Blog:** POST /server/domain/delete-blog

### **Search Bar**

- **Search Blogs:** POST /server/domain/search-blogs
- **Search Users:** POST /server/domain/search-users

### **Notifications**

- **Get New Notifications:** GET /server/domain/new-notification
- **Post New Notification:** POST /server/domain/notifications

### **Comments & Likes**

- **Add Comment:** POST /server/domain/add-comment
- **Reply to Comment:** POST /server/domain/get-replies
- **Delete Comment:** POST /server/domain/delete-comment
- **Add Like to Blog:** POST /server/domain/like-blog

### **User Profile**

- **Get User Profile:** POST /server/domain/get-profile
- **Update User Profile:** POST /server/domain/update-profile

---

## `Contributing` 💡

Contributions are welcome! If you'd like to contribute to DUCK Blog Website, please fork the repository, create a new branch, make your changes, and submit a pull request.

---

## `License` 🔒

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## `Authors` ✒️

Made with ❤️ by Nayra Adel & Bassant Adel.

**`Nayra Adel`** : Full Stack & Backend Developer

[![LinkedIn Badge](https://img.shields.io/badge/LinkedIn-5B2C6F?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/nayra-adel/)
[![GitHub Badge](https://img.shields.io/badge/github-5B2C6F?style=for-the-badge&logo=github)](https://github.com/Nayra-Adel19)

**`Bassant Adel`** : Frontend Developer & Graphic Designer

[![LinkedIn Badge](https://img.shields.io/badge/LinkedIn-5B2C6F?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/basant-adel-hamed/)
[![GitHub Badge](https://img.shields.io/badge/github-5B2C6F?style=for-the-badge&logo=github)](https://github.com/Bassant-Adel)
