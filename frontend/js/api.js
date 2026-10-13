/* api.js - thin wrapper around fetch() for the Express REST API */
const Api = {
  async request(method, url, body) {
    const options = { method };
    if (body instanceof FormData) options.body = body;            // multipart (files) - browser sets headers
    else if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    let res;
    try { res = await fetch(url, options); }
    catch (e) { throw new Error('Cannot reach the server. Is the backend running?'); }
    let data = null;
    try { data = await res.json(); } catch (e) { /* response had no JSON body */ }
    if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
    return data;
  },
  get(url) { return Api.request('GET', url); },
  post(url, body) { return Api.request('POST', url, body); },
  put(url, body) { return Api.request('PUT', url, body); },
  remove(url) { return Api.request('DELETE', url); }
};
