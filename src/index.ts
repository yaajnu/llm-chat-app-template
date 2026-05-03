/**
 * Image Generation Application Template
 *
 * An image generation application using Cloudflare Workers AI.
 * This template demonstrates how to implement an AI-powered image generation
 * interface using the Stable Diffusion XL Lightning model.
 *
 * @license MIT
 */
import { Env } from "./types";

// Model ID for Workers AI image generation model
// https://developers.cloudflare.com/workers-ai/models/
const MODEL_ID = "@cf/bytedance/stable-diffusion-xl-lightning";

// Default system prompt shown to users as a hint
const SYSTEM_PROMPT =
	"Describe the image you want to generate. Be specific about subjects, style, colors, lighting, and composition for best results.";

export default {
	/**
	 * Main request handler for the Worker
	 */
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Handle static assets (frontend)
		if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
			return env.ASSETS.fetch(request);
		}

		// API Routes
		if (url.pathname === "/api/generate") {
			// Handle POST requests for image generation
			if (request.method === "POST") {
				return handleGenerateRequest(request, env);
			}

			// Method not allowed for other request types
			return new Response("Method not allowed", { status: 405 });
		}

		// Return the system prompt hint so the frontend can display it
		if (url.pathname === "/api/prompt-hint") {
			return new Response(JSON.stringify({ hint: SYSTEM_PROMPT }), {
				headers: { "content-type": "application/json" },
			});
		}

		// Handle 404 for unmatched routes
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

/**
 * Handles image generation API requests
 */
async function handleGenerateRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	try {
		// Parse JSON request body
		const { prompt } = (await request.json()) as { prompt: string };

		if (!prompt || prompt.trim() === "") {
			return new Response(
				JSON.stringify({ error: "A prompt is required" }),
				{
					status: 400,
					headers: { "content-type": "application/json" },
				},
			);
		}

		const imageResponse = await env.AI.run(
			MODEL_ID,
			{ prompt: prompt.trim() },
			{
				// Uncomment to use AI Gateway
				// gateway: {
				//   id: "YOUR_GATEWAY_ID", // Replace with your AI Gateway ID
				//   skipCache: false,      // Set to true to bypass cache
				//   cacheTtl: 3600,        // Cache time-to-live in seconds
				// },
			},
		);

		// The model returns a ReadableStream of the PNG image bytes
		return new Response(imageResponse, {
			headers: {
				"content-type": "image/png",
				"cache-control": "no-cache",
			},
		});
	} catch (error) {
		console.error("Error processing image generation request:", error);
		return new Response(
			JSON.stringify({ error: "Failed to generate image" }),
			{
				status: 500,
				headers: { "content-type": "application/json" },
			},
		);
	}
}
