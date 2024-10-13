
const B2 = require("backblaze-b2");


export const useB2FileUpload = async (filename: string, file: any) => {
  const b2 = new B2({
    applicationKeyId: process.env.APPLICATION_KEY_ID,
    applicationKey: process.env.APPLICATION_KEY
  });
  try {
    await b2.authorize();

    const response = await b2.getUploadUrl({
      bucketId: process.env.BUCKET_ID,
    });
    const authToken = response.data.authorizationToken
    const uploadUrl = response.data.uploadUrl

    const options = {
      uploadUrl: uploadUrl,
      uploadAuthToken: authToken,
      fileName: filename+Date.now(),
      data: file,
      onUploadProgress: null
    }

    const uploadedFIle = await b2.uploadFile(options);
    console.log('b2 blaze done')
    return `https://f002.backblazeb2.com/file/${process.env.BUCKET_NAME}/${uploadedFIle.data.fileName}`;
  } catch (e) {
    console.log(e);
    return false;
  }
};