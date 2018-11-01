var saml2 = require('saml2-js');
var fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const path = require('path')
app.use(bodyParser.urlencoded({
  extended: true
}));
 
const port = process.env.PORT || 8080

const rootDomain = "https://monash-saml-sp-mock-dev.appspot.com"


// Set views path
app.set('views', path.join(__dirname, 'views'));
// Set public path
app.use(express.static(path.join(__dirname, 'public')));

// Create service provider
var sp_options = {
  entity_id: `${rootDomain}/saml/metadata`,
  private_key: fs.readFileSync("./config/sp-key.pem").toString(),
  certificate: fs.readFileSync("./config/sp-cert.pem").toString(),
  assert_endpoint: `${rootDomain}/saml/assert`,
  nameid_format: "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",
  sign_get_request: false,
  allow_unencrypted_assertion: true
};
var sp = new saml2.ServiceProvider(sp_options);
 
// Create identity provider
var idp_options = {
  sso_login_url: "./login",
  sso_logout_url: "./logout",
};
var idp = new saml2.IdentityProvider(idp_options);
 
// ------ Define express endpoints ------
 
// Endpoint to retrieve metadata
app.get("/saml/metadata", function(req, res) {
  res.type('application/xml');
  res.send(sp.create_metadata());
});
 
// Starting point for login
app.get("/login", function(req, res) {
  sp.create_login_request_url(idp, {}, function(err, login_url, request_id) {
    if (err != null)
      return res.send(500);
    redirect_assert(idp, {}, function(err, login_url, logout_url) {
      res.send('/')
    }) 
  });
});
 
// Assert endpoint for when login completes
app.post("/saml/assert", function(req, res) {
  var options = {request_body: req.body};
  sp.post_assert(idp, options, function(err, saml_response) {
    if (err != null)
      return res.send(500);
 
    // Save name_id and session_index for logout
    // Note:  In practice these should be saved in the user session, not globally.
    name_id = saml_response.user.name_id;
    session_index = saml_response.user.session_index;
 
    res.send("Hello #{saml_response.user.name_id}!");
  });
});
 
// Starting point for logout
app.get("/logout", function(req, res) {
  var options = {
    name_id: name_id,
    session_index: session_index
  };
 
  sp.create_logout_request_url(idp, options, function(err, logout_url) {
    if (err != null)
      return res.send(500);
    res.redirect(logout_url);
  });
});

app.listen(port);