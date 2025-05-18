import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set default Leaflet icon path
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon path
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

createRoot(document.getElementById("root")!).render(<App />);
