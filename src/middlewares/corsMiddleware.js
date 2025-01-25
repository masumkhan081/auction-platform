const cors = require("cors");

// List of allowed origins
const allowedOrigins = [
    "http://localhost:3001",
    "http://localhost:5173",
    "https://pharmacy-mgmt.vercel.app"
];

const corsOptions = cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
})

module.exports = cors(corsOptions);