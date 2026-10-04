# www.awesomedataviz.com redirect

Cloudish routes one custom domain per project, so `www.awesomedataviz.com` is
served by its own tiny project (`awesome-dataviz-www/awesomedataviz-www`) that
permanently redirects every request to `https://awesomedataviz.com`. It uses
its own API key (`CLOUDISH_WWW_API_KEY`) so it can scale to zero when idle
while the main site stays always on.

It rarely needs redeploying. To redeploy it by hand:

```sh
tar -czf /tmp/www.tar.gz Dockerfile server.mjs
curl -X POST https://cloudish.ai/api/v1/projects \
  -H "Authorization: Bearer $CLOUDISH_WWW_API_KEY" \
  -F name=awesomedataviz-www -F port=8080 -F cpuCores=0.1 -F memoryGb=0.2 \
  -F 'env={"REDIRECT_TO":"https://awesomedataviz.com"}' -F context=@/tmp/www.tar.gz
```
