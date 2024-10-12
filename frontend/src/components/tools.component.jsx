// Importing tools
import Embed from '@editorjs/embed';
import List from '@editorjs/list';
import Image from '@editorjs/image';
import Header from '@editorjs/header';
import Quote from '@editorjs/quote';
import Marker from '@editorjs/marker';
import InlineCode from '@editorjs/inline-code';
import { uploadImage } from "../common/upload-image";


const uploadImageByFile = (e) => {
  return uploadImage(e)
    .then((url) => {
      if (url) {
        return {
          success: 1,
          file: { url },
        };
      } else {
        throw new Error('Image upload failed: URL not received');
      }
    })
    .catch((error) => {
      console.error('Error uploading image:', error);
      return { success: 0, error: error.message };
    });
};


const uploadImageByURL = (e) => {
  return Promise.resolve(e).then((url) => {
    return {
      success: 1,
      file: { url },
    };
  }).catch((error) => {
    console.error('Error uploading image by URL:', error);
    return { success: 0, error: error.message };
  });
};


export const tools = {
  embed: Embed,
  list: {
    class: List,
    inlineToolbar: true,
  },
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByUrl: uploadImageByURL,
        uploadByFile: uploadImageByFile,
      },
    },
  },
  header: {
    class: Header,
    config: {
      placeholder: 'Type Heading....',
      levels: [2, 3],
      defaultLevel: 2,
    },
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
  },
  marker: Marker,
  inlineCode: InlineCode,
};
