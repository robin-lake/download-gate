# Download Gate #

### Deploying via AWS CDK ###
To configue the app for deployment via the AWS CDK, first add the following lines to your environment variables file in `cdk/.env`:
```
DOMAIN_NAME=your-domain
SITE_SUBDOMAIN=your-subdomain
API_SUBDOMAIN=your-api-subdomain

CLERK_PUBLISHABLE_KEY=your-publishable-key
CLERK_SECRET_KEY=your-secret-key
```
The frontend can be deployed by running
``` 
cd cdk
npx cdk deploy DownloadGateFrontendStack
```
The backend can be deployed by running
```
cd cdk
npx cdk deploy DownloadGateBackendStack
```

### Setting Up CI/CD ###
In order to set up CI/CD, add these lines to your variables file in `cdk/.env`:

```
REPO_NAME=your-repo-name
REPO_OWNER=your-github-user
```

Run the CiIamStack once from your cdk directory
```
cd cdk
npm install
npx cdk deploy DownloadGateCiIamStack
```

You will see an output in the terminal that looks like this:
```
DownloadGateCiIamStack.GithubActionsRoleArn = arn:aws:iam::{your-aws-account}:role/DownloadGateCiIamStack-GithubActionsRole{some-string}
```

Copy it to your Github secrets. Go to Github --> Settings --> Secrets and variabls --> Actions. Create a secret named ```AWS_GITHUB_ROLE_ARN``` and copy the calue from above.

After your IAM role is configured, subsequent pushes to main will deploy the full CDK build via Github Actions.
### Using Github Environment Variables For CI/CD ###
To keep secrets secure, and still avoid paying for AWS Secrets Manager, try using Github environments. The following can be added as environment variables:
```
API_SUBDOMAIN
DOMAIN_NAME
GRAFANA_CLOUD_OTLP_ENDPOINT
SITE_SUBDOMAIN
```
Additionally, add the following as secrets:
```
AWS_GITHUB_ROLE_ARN
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
GRAFANA_CLOUD_OTLP_AUTH
```
The `cd.yml` script within `.github/workflows` will now use them when CD builds for deployment

### Staging Deployments ###
Pushes to the `staging` branch deploy a separate staging environment. Configure a **staging** environment in GitHub (Settings → Environments) with the same `AWS_GITHUB_ROLE_ARN` secret and staging-specific variables: `DOMAIN_NAME`, `SITE_SUBDOMAIN`, `API_SUBDOMAIN`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`. The CI IAM role trusts both `main` and `staging`; re-deploy `DownloadGateCiIamStack` once from main after enabling staging so the updated trust policy is applied.


### Adding Grafana Cloud integration ###
Optionally, you can add Grafana Cloud to the stack. This is a free alternative to using AWS's managed Grafana service, which is $9/user/month. To do so, add the following to your github environment secrets:
```
GRAFANA_CLOUD_OTLP_AUTH={your-grafana-auth}
```
You can get the GRAFANA_CLOUD_OTLP_AUTH value after making a new opentelemetry connection in Grafana Cloud, then entering the following in your command line:
```
export GRAFANA_CLOUD_BASIC_AUTH_HEADER="Basic $(echo -n {your-grafana-auth-header-value} | base64 -w0)"
```
and copying the result.

Then, add the following to your github environment variables:
```
GRAFANA_CLOUD_OTLP_ENDPOINT={your-grafana-endpoint}
```

### Cover art and audio uploads (media storage) ###

Cover art and audio for download gates are stored in **object storage**. The backend uses a small abstraction so you can run the same code locally and in production.

- **Why S3?** In production, media is stored in **Amazon S3**. S3 is a good fit: it scales with traffic, is cost-effective for binary blobs, integrates with your existing AWS/CDK setup, and supports private objects with short-lived signed URLs so you don’t expose the bucket. The same API works with **LocalStack** if you want a full S3-compatible stack locally.

- **Local development (no AWS):** If `MEDIA_BUCKET` is not set (e.g. when running the backend with `npm run dev` and no bucket env), the backend uses **local filesystem storage**. Files are written under `backend/local-storage` and served at `GET /api/uploads/:key`. Set `STORAGE_BASE_URL` in `backend/.env.development` to your dev server (e.g. `http://localhost:3000`) so returned URLs work from the frontend. Optional: `LOCAL_STORAGE_DIR` overrides the directory (default `./local-storage`).

- **Production (or LocalStack):** When the backend runs in Lambda, CDK sets `MEDIA_BUCKET` and `BASE_URL`. Uploads go to S3; the API returns stable URLs that point to `GET /api/media/stream?key=...`, which redirects to a presigned S3 URL so the bucket can stay private.

**Upload endpoints (authenticated):**

- `POST /api/media/upload-cover` — field `file`; image (JPEG, PNG, GIF, WebP); max 5 MB. Returns `{ url, key }` for `thumbnail_url`.
- `POST /api/media/upload-audio` — field `file`; audio (MP3, WAV, FLAC, AAC, OGG); max 100 MB. Returns `{ url, key }` for `audio_file_url`.

Use the returned `url` in the create/update download-gate payloads. No extra env is required for local dev beyond your usual backend URL and optional `STORAGE_BASE_URL`.

### Adding Music Provider Integrations ###

Each of the music services requires an api key. Here are the steps for connecting them.

#### SoundCloud ####
Go to https://soundcloud.com/you/apps
Register a new app
You will need to add the following variables to your environment variables/secrets:
```
SOUNDCLOUD_CLIENT_ID
SOUNDCLOUD_CLIEND_SECRET
SOUNDCLOUD_REDIRECT_URI
SOUNDCLOUD_SUCCESS_REDIRECT_URI
```