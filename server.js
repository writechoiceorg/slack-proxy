const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const flatten = require("flat");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// The platform's edge proxy (DO App Platform, Nginx, etc.) terminates TLS and
// forwards the original protocol via X-Forwarded-Proto, so req.secure needs
// this to reflect the real scheme instead of always reading as http.
app.set("trust proxy", 1);

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use(
  express.json({
    type: ["application/json", "text/plain"],
  }),
);

// Redirect http calls to https
// (skip /healthz: platform health checks hit the container directly over
// plain HTTP, bypassing the HTTPS edge, so redirecting it would fail checks)
app.use((req, res, next) => {
  if (req.path !== "/healthz" && !req.secure && process.env.NODE_ENV === "production") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
app.use(express.static("public"));

app.post(["/workflows/*", "/triggers/*"], (req, res) => {
  res.send("ok");
  const payload = req.body;
  // Slack's new Workflow builder restricts variable keys to
  // "a combination of letters, numbers, hyphens, and underscores."
  // '.' is no longer accepted, so flattened keys use '__' as the delimiter.
  const flatPayload = flatten(payload, { delimiter: "__" });

  // workflow builder requires values to be strings
  // iterate over every value and convert it to string
  Object.keys(flatPayload).forEach((key) => {
    flatPayload[key] = "" + flatPayload[key];
  });

  axios.post(`https://hooks.slack.com${req.path}`, flatPayload);
});

app.get("/healthz", (req, res) => {
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  // this route should ask you to post your slack webhook urls and give you the webhook to supply to github
  // (Essentially changes hooks.slack.com to our servers path)
  res.sendFile(path.join(__dirname + "/public/index.html"));
  console.log(req);
});

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
