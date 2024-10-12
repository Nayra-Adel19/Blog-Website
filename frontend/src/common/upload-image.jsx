import axios from 'axios';

export const uploadImage = (imageFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(imageFile);

    reader.onloadend = () => {
      const base64Image = reader.result;
      axios.post(import.meta.env.VITE_SERVER_DOMAIN + '/upload', { image: base64Image })
        .then((res) => {
          resolve(res.data.url);
        })
        .catch((err) => {
          reject(err);
        });
    };

    reader.onerror = (err) => {
      reject(err);
    };
  });
};