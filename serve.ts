import {
  json,
  serve,
  validateRequest,
} from "https://deno.land/x/sift@0.1.7/mod.ts";
import { getProfileUrlsFromNotion } from "./notion.ts";

async function handleRequest(request: Request) {
  // validateRequest() ensures that incoming requests are of methods POST and GET.
  // Slack sends a POST request with a form field named text that contains the
  // information provided by user. We're allowing GET for anyone visiting the
  // endpoint in browser. You can disallow GET for your application as it is
  // not required by Slack.
  const { error } = await validateRequest(request, {
    GET: {},
    POST: {},
  });
  if (error) {
    // validateRequest() generates appropriate error and status code when
    // the request isn't valid. We return that information in a format that's
    // appropriate for Slack but there's a good chance that we will not
    // encounter this error if the request is actually coming from Slack.
    return json(
      // "ephemeral" indicates that the response is short-living and is only
      // shown to user who invoked the command in Slack.
      { response_type: "ephemeral", text: error.message },
      { status: error.status },
    );
  }

  // If a user is trying to visit the endpoint in a browser, let's return a html
  // page instructing the user to visit the GitHub page.
  if (request.method === "GET") {
    return new Response(
      `<body
        align="center"
        style="font-family: Avenir, Helvetica, Arial, sans-serif; font-size: 1.5rem;"
      >
        <p>
          Visit <a href="https://github.com/fsubal/slack-whois-notion">GitHub</a>
          page for instructions on how to install this Slash Command on your Slack workspace.
        </p>
      </body>`,
      {
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      },
    );
  }

  try {
    const formData = await request.formData();
    const userName = formData.get("text")
    // The text after command (`/shuffle <text>`) is passed on to us by Slack in a form
    // field of the same name in the request.
    if (typeof userName !== 'string') {
      return json(
        { response_type: "ephemeral", text: "usage: /whois [@user_name]" },
        { status: 400 },
      );
    }

    const urls = await getProfileUrlsFromNotion(userName)

    // This is the response that's returned when the command is invoked.
    // The layout uses Slack's Block Kit to present information. You
    // can learn more about it here: https://api.slack.com/block-kit.
    return json({
      response_type: "in_channel",
      blocks: urls.map(url => ({
          type: "section",
          text: {
            type: "mrkdwn",
            text: url,
          },
          accessory: {},
      })),
    });
  } catch (error) {
    // If something goes wrong in the above block, let's log the error
    // and return a generic error to the user.
    console.log(error);
    return json(
      {
        response_type: "ephemeral",
        text: "Error fetching the results. Please try after sometime.",
      },
      { status: 500 },
    );
  }
}

// Call handleRequest() on requests to "/" path.
serve({
  "/": handleRequest,
});
