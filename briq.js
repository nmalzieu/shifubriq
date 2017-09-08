const Briq = require('briq-api').Client;

const briq = new Briq({
  accessToken: 'VRoBeEDjNM9CrUMeNAJ4JzfQmHGqwGd2rcTK2P8zhPuWPzQGVi7Rn2n4HhtNIggGCxplOiLXTYDBAG4kHEMTt2hYxLg8uyonM4OtmAjQrTxbrU6ehulvESvWjfQ4xfHw',
  // For dev only
  // baseURL: 'https://briq-staging.herokuapp.com/v0',
});

export default briq
