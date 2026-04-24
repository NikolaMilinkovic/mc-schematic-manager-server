const axios = require("axios");
const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_SCHEMATIC_SCHEMA = {
	type: "object",
	properties: {
		schematic_name: { type: "string" },
		schematic_description: { type: "string" },
		schematic_tags: {
			type: "array",
			items: { type: "string" },
		},
	},
	required: ["schematic_name", "schematic_description", "schematic_tags"],
	additionalProperties: false,
};

const DEFAULT_SCHEMATIC_PROMPT =
	"Analyze this Minecraft schematic image and extract schematic_name, schematic_description, and schematic_tags. Tags should be concise keywords describing the schematic. Return the result in JSON format matching this schema: { schematic_name: string, schematic_description: string, schematic_tags: string[] }";

function buildResponseFormat(responseSchema, schemaName = "image_analysis") {
	if (!responseSchema || typeof responseSchema !== "object") {
		return undefined;
	}

	return {
		type: "json_schema",
		name: schemaName,
		strict: true,
		schema: responseSchema,
	};
}

function parseMaybeJson(text) {
	if (typeof text !== "string") {
		return text;
	}

	try {
		return JSON.parse(text);
	} catch (err) {
		const firstBrace = text.indexOf("{");
		const lastBrace = text.lastIndexOf("}");

		if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
			try {
				return JSON.parse(text.slice(firstBrace, lastBrace + 1));
			} catch (innerErr) {
				return text;
			}
		}

		return text;
	}
}

function extractResponsePayload(responseData) {
	let rawText = typeof responseData?.output_text === "string" ? responseData.output_text : "";
	let parsedResult;

	const outputItems = Array.isArray(responseData?.output) ? responseData.output : [];
	for (const outputItem of outputItems) {
		const contents = Array.isArray(outputItem?.content) ? outputItem.content : [];
		for (const content of contents) {
			if (!rawText && typeof content?.text === "string") {
				rawText = content.text;
			}

			if (parsedResult === undefined && content?.json && typeof content.json === "object") {
				parsedResult = content.json;
			}
		}
	}

	if (parsedResult === undefined && rawText) {
		parsedResult = parseMaybeJson(rawText);
	}

	if (!rawText && parsedResult && typeof parsedResult === "object") {
		rawText = JSON.stringify(parsedResult);
	}

	return {
		rawText: rawText || "",
		result: parsedResult === undefined ? "" : parsedResult,
	};
}

async function runOpenAIImageAnalysis({
	apiKey,
	imageUrl,
	imageBase64,
	prompt = DEFAULT_SCHEMATIC_PROMPT,
	model = process.env.OPENAI_MODEL || process.env.OPENAI_FALLBACK_MODEL || "gpt-4.1-mini",
	responseSchema,
	schemaName = "minecraft_schematic_metadata",
}) {
	const imageInput = imageUrl
		? { type: "input_image", image_url: imageUrl }
		: {
				type: "input_image",
				image_url: imageBase64.startsWith("data:")
					? imageBase64
					: `data:image/png;base64,${imageBase64}`,
			};

	const requestPayload = {
		model,
		input: [
			{
				role: "user",
				content: [
					{
						type: "input_text",
						text: `${prompt}\n\nReturn JSON only.`,
					},
					imageInput,
				],
			},
		],
	};

	const textFormat = buildResponseFormat(
		responseSchema || DEFAULT_SCHEMATIC_SCHEMA,
		schemaName,
	);
	if (textFormat) {
		requestPayload.text = { format: textFormat };
	}

	const response = await axios.post(
		"https://api.openai.com/v1/responses",
		requestPayload,
		{
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		},
	);

	const extracted = extractResponsePayload(response?.data);

	if (process.env.OPENAI_DEBUG_RESPONSE === "true") {
		console.log(
			"[OpenAI debug] response metadata:",
			JSON.stringify(
				{
					id: response?.data?.id,
					status: response?.data?.status,
					outputCount: Array.isArray(response?.data?.output)
						? response.data.output.length
						: 0,
					hasOutputText: Boolean(response?.data?.output_text),
				},
				null,
				2,
			),
		);
	}

	return {
		model,
		result: extracted.result,
		rawText: extracted.rawText,
	};
}

async function runImg1StartupTest() {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		console.error("[OpenAI startup test] OPENAI_API_KEY is not configured.");
		return;
	}

	try {
		const imagePath = path.resolve(__dirname, "../../testing/Img_1.png");
		const imageBuffer = await fs.readFile(imagePath);
		const imageBase64 = imageBuffer.toString("base64");

		const analysis = await runOpenAIImageAnalysis({
			apiKey,
			imageBase64,
		});

		console.log("[OpenAI startup test] Img_1.png analysis:");
		console.log(JSON.stringify(analysis, null, 2));
	} catch (err) {
		const details = err?.response?.data || err.message;
		console.error("[OpenAI startup test] Failed:", details);
	}
}

async function analyzeImage(req, res) {
	try {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			return res.status(500).json({
				message: "OPENAI_API_KEY is not configured.",
			});
		}

		const {
			imageUrl,
			imageBase64,
			prompt = DEFAULT_SCHEMATIC_PROMPT,
			model = process.env.OPENAI_MODEL || process.env.OPENAI_FALLBACK_MODEL || "gpt-4.1-mini",
			responseSchema,
			schemaName = "minecraft_schematic_metadata",
		} = req.body || {};

		if (!imageUrl && !imageBase64) {
			return res.status(400).json({
				message: "Provide either imageUrl or imageBase64 in request body.",
			});
		}

		const analysis = await runOpenAIImageAnalysis({
			apiKey,
			imageUrl,
			imageBase64,
			prompt,
			model,
			responseSchema,
			schemaName,
		});

		return res.status(200).json(analysis);
	} catch (err) {
		const status = err?.response?.status || 500;
		const details = err?.response?.data || err.message;

		return res.status(status).json({
			message: "Failed to analyze image with OpenAI.",
			details,
		});
	}
}

module.exports = {
	analyzeImage,
	runImg1StartupTest,
};
