/**
 * AI Image Generator Frontend
 *
 * Handles UI interactions and communication with the image generation backend API.
 */

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");

// State
let isProcessing = false;

// Auto-resize textarea as user types
userInput.addEventListener("input", function () {
	this.style.height = "auto";
	this.style.height = this.scrollHeight + "px";
});

// Generate on Enter (without Shift)
userInput.addEventListener("keydown", function (e) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		generateImage();
	}
});

// Generate button click handler
sendButton.addEventListener("click", generateImage);

/**
 * Sends a prompt to the image generation API and displays the result
 */
async function generateImage() {
	const prompt = userInput.value.trim();

	// Don't send empty prompts
	if (prompt === "" || isProcessing) return;

	// Disable input while processing
	isProcessing = true;
	userInput.disabled = true;
	sendButton.disabled = true;

	// Add user prompt to chat
	addTextMessage("user", prompt);

	// Clear input
	userInput.value = "";
	userInput.style.height = "auto";

	// Show generating indicator
	typingIndicator.classList.add("visible");

	try {
		// Send request to image generation API
		const response = await fetch("/api/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ prompt }),
		});

		if (!response.ok) {
			const errData = await response.json().catch(() => ({}));
			throw new Error(errData.error || "Failed to generate image");
		}

		// Convert the PNG response to an object URL and display it
		const blob = await response.blob();
		const imageUrl = URL.createObjectURL(blob);
		addImageMessage(imageUrl, prompt);
	} catch (error) {
		console.error("Error:", error);
		addTextMessage("assistant", `Sorry, there was an error: ${error.message}`);
	} finally {
		// Hide generating indicator
		typingIndicator.classList.remove("visible");

		// Re-enable input
		isProcessing = false;
		userInput.disabled = false;
		sendButton.disabled = false;
		userInput.focus();
	}
}

/**
 * Adds a plain text message bubble to the chat
 */
function addTextMessage(role, content) {
	const messageEl = document.createElement("div");
	messageEl.className = `message ${role}-message`;
	const p = document.createElement("p");
	p.textContent = content;
	messageEl.appendChild(p);
	chatMessages.appendChild(messageEl);
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Adds a generated image to the chat as an assistant message
 */
function addImageMessage(imageUrl, altText) {
	const messageEl = document.createElement("div");
	messageEl.className = "message assistant-message";

	const img = document.createElement("img");
	img.src = imageUrl;
	img.alt = altText;
	img.title = altText;

	const caption = document.createElement("p");
	caption.className = "image-caption";
	caption.textContent = `"${altText}"`;

	messageEl.appendChild(img);
	messageEl.appendChild(caption);
	chatMessages.appendChild(messageEl);
	chatMessages.scrollTop = chatMessages.scrollHeight;
}
