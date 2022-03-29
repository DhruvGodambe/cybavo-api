const https = require("https");
const crypto = require("crypto");
const axios = require("axios")
const express = require("express");
const api = require('./helpers/apiCaller');
const rs = require("./helpers/randstr")
const apiCode = require("./models/apiCode");
const app = express();
const port = 3000;

require("dotenv").config(); 

function getQueryParams(query) {
    if (Object.keys(query).length === 0) {
      return null;
    }
  
    return Object.keys(query).map((key) => {
      return `${key}=${query[key]}`;
    }); 
}
  

app.get("/", (req, res) => {
    console.log("welcome home");
    console.log(api);
    res.json({
        "Message": "Welcome Home"
    })
})

app.get('/wallet/:wallet_id/addresses', async function(req, res) {
    if (!req.params.wallet_id) {
      res.status(400).json({ error: 'invalid parameters' });
      return;
    }
    const apires = await api.makeRequest(req.params.wallet_id, "GET",
      `/v1/sofa/wallets/${req.params.wallet_id}/addresses`, getQueryParams(req.query), null);
    if (apires.statusCode) {
      res.status(apires.statusCode).json(apires.result);
    } else {
      res.status(400).json(apires);
    }
  });

app.get('/wallet/:wallet_id/apisecret/activate', async function(req, res) {
  function buildChecksum(params, secret, t, r, postData) {
    const p = params || [];
    p.push(`t=${t}`, `r=${r}`);
    if (postData) {
      if (typeof postData === 'string') {
        p.push(postData);
      } else {
        p.push(JSON.stringify(postData));
      }
    }
    p.sort();
    p.push(`secret=${secret}`);
    console.log(p)
    return crypto.createHash('sha256').update(p.join('&')).digest('hex');
  }

  // const apiCodeObj = await apiCode.getAPICode(22222);

  const wallet_id = 403157
  const url = `https://sofatest.sandbox.cybavo.com/v1/sofa/wallets/${wallet_id}/apisecret/activate`
  const r = rs.randomString(8);
  const t = Math.floor(Date.now()/1000);
  const options = {
    method: "post",

    headers: {
      'Content-Type': "application/json",
      'X-API-CODE': "51PyQqDvfhKi8r5TK",
      'X-API-TOKEN': "51PyQqDvfhKi8r5TK",
      'X-CHECKSUM': buildChecksum([`{"WALLET_ID": ${wallet_id}}`], "GzdsBMUXvFQaoCcoswuPpgQz9gU", t, r, JSON.stringify(req.body)),
      "User-Agent": "nodejs"
    }
  }

  console.log({
    ...options,
    url
  });
  axios({
    ...options,
    url
  }).then((resp) => {
    res.json(resp);
  }).catch((err) => {
    // console.log("ERRRR:::", err)
    res.json(err)
  })

  // res.send(resp);
});

app.listen(port, () => {
    console.log("server listening on port: ", port);
})