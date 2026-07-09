// Test sending a verification email via the signup API
const http = require("http");

const data = JSON.stringify({
  fullName: "Test DocuAI User",
  email: "gagandeep.sethi@promaticsindia.com",
  password: "Test@12345",
  confirmPassword: "Test@12345",
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/auth/signup",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    try {
      console.log("Response:", JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log("Body:", body);
    }
  });
});

req.on("error", (err) => console.error("Request error:", err.message));
req.write(data);
req.end();
