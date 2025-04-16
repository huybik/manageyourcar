import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add material icons
const link = document.createElement("link");
link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
link.rel = "stylesheet";
document.head.appendChild(link);

// Add Roboto font
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// Set title
document.title = "FleetMaster - Auto Fleet Management System";

createRoot(document.getElementById("root")!).render(<App />);
