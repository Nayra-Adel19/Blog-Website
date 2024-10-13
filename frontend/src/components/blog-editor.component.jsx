import { Link } from "react-router-dom";
import duckLogo from '../imgs/img-logo.png';
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog-banner.png";
import { useContext, useEffect } from "react";
import { uploadImage } from '../common/upload-image';
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from '@editorjs/editorjs'
import { tools } from "./tools.component";


const BlogEditor = () => {
		let { blog, blog: {title, banner, content, tags, des }, setBlog, textEditor, setTextEditor, setEditorState } = useContext(EditorContext)

		// useEffect
		useEffect(() => {
			setTextEditor(new EditorJS({
				holderId: "textEditor",
				data: content,
				tools: tools,
				placeholder: "Let's write an awesome story"
			}))
		}, [])

    const handleBannerUpload = (e) => {
        const img = e.target.files[0];

        let loadingToast = toast.loading("Uploading...");

				uploadImage(img)
				.then((uploadedUrl) => {
					toast.success("Upload complete! 👏");
					setBlog((prevBlog) => ({ ...prevBlog, banner: uploadedUrl }));
				})
				.catch((err) => {
					toast.error("Upload failed! 💔");
					console.error("Error:", err);
				})
				.finally(() => {
					toast.dismiss(loadingToast);
				});
    };

		const handleTitleKeyDown = (e) => {
			console.log(e);
			if(e.keyCode == 13){
					e.preventDefault();
			}
		}

		const handleTitleChange = (e) => {
			let input = e.target;
			console.log(input.scrollHeight);

			input.style.height = "auto";
			input.style.height = input.scrollHeight + "px";

			setBlog({ ...blog, title: input.value })

		}

		const handleError = (e) => {
			let img = e.target;
			img.src = defaultBanner;
		}

		const handlePublishEvent = () => {
			if(!banner.length){
				return toast.error("Upload a blog banner to publish it")
			}
			if(!title.length){
				return toast.error("Write blog title to publish it")
			}
			if(textEditor.isReady){
				textEditor.save().then(data => {
					if(data.blocks.length){
						setBlog({ ...blog, content: data })
						setEditorState("Publish")
					} else{
						return toast.error("Write something in your blog to publish it")
					}
				})
				.catch((err) => {
					console.log(err);
				})
			}
		}

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={duckLogo} alt="Duck Logo" />
                </Link>
                <p className="max-md:hidden text-black line-clamp-1 w-full">
										{ title.length ? title : "New Blog" }
                </p>
                <div className="flex gap-4 ml-auto">
                    <button className="btn-dark py-2" onClick={handlePublishEvent}>Publish</button>
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
                                    src={banner}
                                    className="z-20"
                                    alt="Blog Banner"
																		onError={handleError}
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

												<textarea
													defaultValue={title}
													className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
													placeholder="Blog Title"
													onKeyDown={handleTitleKeyDown}
													onChange={handleTitleChange}
												></textarea>

												<hr className="w-full opacity-10 my-5" />

												<div id="textEditor" className="font-gelasio"></div>

                    </div>
                </section>
            </AnimationWrapper>
        </>
    );
};

export default BlogEditor;