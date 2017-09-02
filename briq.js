const Briq = require('briq-api').Client;

const briq = new Briq({
  accessToken: 'IVGSeS7thwN1dWsJDhYTFXHjK6zLAKDGlVnqljLYe306DR45LqZ1hbs4uymKlcWt3MHuvmGQcUzGJQv6YLF3e862XMMg55CYKklXGHw06P3jBrHb0YkJtVg7XSfFgcEY',
  // For dev only
  // baseURL: 'https://briq-staging.herokuapp.com/v0',
});

export default briq
