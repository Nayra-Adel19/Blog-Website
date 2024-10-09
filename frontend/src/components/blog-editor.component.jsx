import { Link } from "react-router-dom";
import duckLogo from '../imgs/img-logo.png';
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog-banner.png";
import { useState } from "react";
import axios from 'axios';
import { Toaster, toast } from "react-hot-toast";

const BlogEditor = () => {
    const [image, setImage] = useState(null);

    const handleBannerUpload = (e) => {
        const img = e.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(img);
        reader.onloadend = () => {
            const base64Image = reader.result;

            let loadingToast = toast.loading("Uploading...");

            axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/upload', { image: base64Image })
                .then(res => {
                    setImage(res.data.url);
										// console.log("Image URL from Server:", res.data.url);
                    toast.success("Upload complete! 👍");
                })
                .catch(err => {
                    toast.error("Upload failed!");
                    console.error("Error:", err);
                })
                .finally(() => {
                    toast.dismiss(loadingToast);
                });
        };
        reader.onerror = (err) => {
            toast.error("Failed to read the file");
            console.error("FileReader Error:", err);
        };
    };

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={duckLogo} alt="Duck Logo" />
                </Link>
                <p className="max-md:hidden text-black line-clamp-1 w-full">
                    New Blog
                </p>
                <div className="flex gap-4 ml-auto">
                    <button className="btn-dark py-2">Publish</button>
                    <button className="btn-light py-2">Save Draft</button>
                </div>
            </nav>

            <Toaster />

            <AnimationWrapper>
                <section>
                    <div className="mx-auto max-w-[900px] w-full">
                        <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
                            <label htmlFor="uploadBanner">
                                <img
                                    src={image || defaultBanner}
                                    className="z-20"
                                    alt="Blog Banner"
                                />
                                <input
                                    id="uploadBanner"
                                    type="file"
                                    accept=".png, .jpg, .jpeg"
                                    hidden
                                    onChange={handleBannerUpload}
                                />
                            </label>
                        </div>
                    </div>
                </section>
            </AnimationWrapper>
        </>
    );
};

export default BlogEditor;