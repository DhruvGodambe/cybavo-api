const https = require('https');
const crypto = require('crypto');
const rs = require('./randstr');
const cfg = require('../models/config.js');
const apicode = require('../models/apicode');

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
  return crypto.createHash('sha256').update(p.join('&')).digest('hex');
}

function tryParseJSON(s) {
    const o = JSON.parse(s);
    if (o && typeof o === 'object') {
      return o;
    }
  return s;
}

function doRequest(url, options, postData) {
  console.log('request -> ', url, ', options ->', options);
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const resData = [];
      res.on('data', (fragments) => {
        resData.push(fragments);
      });
      res.on('end', () => {
        const resBody = Buffer.concat(resData);
        resolve({ result: tryParseJSON(resBody.toString()), statusCode: res.statusCode });
      });
      res.on('error', (error) => {
        reject(error);
      });
    });
    req.on('error', (error) => {
      reject(error);
    });
    if (postData) {
      if (options.method === 'DELETE') {
        req.useChunkedEncodingByDefault = true;
      }
      req.write(postData);
    }
    req.end();
  });
}

const makeRequest = async function (targetID, method, api, params, postData) {
  if (method === '' || api === '') {
    return { error: 'invalid parameters' };
  }
  const r = rs.randomString(8);
  const t = Math.floor(Date.now()/1000);
  let url = `${cfg.api_server_url}${api}?t=${t}&r=${r}`;
  if (params) {
    url += `&${params.join('&')}`;
  }
  const apiCodeObj = await apicode.getAPICode(targetID);
  if (!apiCodeObj) {
    console.log(`unable to find api code/secret of wallet_id ${targetID}`);
    return { error: `unable to find api code/secret of wallet_id ${targetID}` };
  }
  const options = {
    method,
    headers: {
      'X-API-CODE': apiCodeObj.code,
      'X-CHECKSUM': buildChecksum(params, apiCodeObj.secret, t, r, postData),
      "User-Agent": "nodejs",
    },
  };

  if (method === 'POST' || method === 'DELETE') {
    options.headers['Content-Type'] = 'application/json';
  }

  try {
    const result = await doRequest(url, options, postData);
    const resp = tryParseJSON(result);
    console.log('response ->', resp ? JSON.stringify(resp) : '');
    return resp;
  } catch(error) {
    const resp = tryParseJSON(error);
    console.log('response ->', resp ? JSON.stringify(resp) : '');
    return resp;
  }
}

module.exports = {
  makeRequest
}