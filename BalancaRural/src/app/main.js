import { createApp } from "vue";
import App from "./App.vue";
import { initTheme } from "./theme.js";
import "../styles/global.css";

initTheme();

createApp(App).mount("#app");
