import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import material icons
const materialIconsLink = document.createElement("link");
materialIconsLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
materialIconsLink.rel = "stylesheet";
document.head.appendChild(materialIconsLink);

// Import Roboto font
const robotoFontLink = document.createElement("link");
robotoFontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap";
robotoFontLink.rel = "stylesheet";
document.head.appendChild(robotoFontLink);

createRoot(document.getElementById("root")!).render(<App />);
