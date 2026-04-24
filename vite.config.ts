import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Import the SWC plugin

export default defineConfig({
  plugins: [react()],
});
