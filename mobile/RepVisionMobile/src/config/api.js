const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP;
const PORT = process.env.EXPO_PUBLIC_BACKEND_PORT;
const API_PATH = process.env.EXPO_PUBLIC_API_PATH;

// Tam API URL'sini burada birleştiriyoruz
export const API_URL = `http://${BACKEND_IP}:${PORT}${API_PATH}`;