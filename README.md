# Setup

`npm install` to get the Svelte dependencies set up.

Change into the /sever directory and run `npm install` there to set up the server

## Developing

Install dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

# Deployment

Once ready you can now deploy your app to a Twilio Functions server with `twilio serverless:deploy`.

Go to the Functions URL and in the assets section you will see the compiled Svelte app. Run the index.html file.