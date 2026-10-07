import "../css/app.css";
import { createInertiaApp } from "@inertiajs/react";
createInertiaApp({
    title: (title) => (title ? `${title} · RoomFix` : "RoomFix"),
    pages: { path: "./pages", extension: ".tsx" },
    strictMode: true,
    progress: { color: "#b29b56" },
});
