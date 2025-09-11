import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not set or empty. Please define it in your .env file.');
}

export const config = {
  mongodb: {
    MONGODB_URI,
  },
};
