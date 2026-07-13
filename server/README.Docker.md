### Building and running the backend

From the repository root, start the full development stack:

```bash
docker compose up --build
```

The backend API will be available at http://localhost:3000.

Health checks:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health
```

Run database migrations against the Compose database:

```bash
docker compose exec server npm run db:migrate
```

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)
