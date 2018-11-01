const samlp = require("samlp");
var fs = require("fs");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const pug = require("pug")
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

const port = process.env.PORT || 8080;

const rootDomain = "https://monash-saml-sp-mock-dev.appspot.com";

var idpConfiguration = {
  issuer: `${rootDomain}/saml/metadata`,
  key: fs.readFileSync("./config/sp-key.pem").toString(),
  cert: fs.readFileSync("./config/sp-cert.pem").toString(),
  getPostURL: function(wtrealm, wreply, req, callback) {
    return callback(null, "http://someurl.com");
  }
};

app.get("/samlp", samlp.auth(idpConfiguration));

app.get("/saml/metadata", samlp.metadata(idpConfiguration));


app.set('view engine', 'pug')
app.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Hello there!' })
})
app.listen(port);
console.log(`App running at PORT: ${port}`);
