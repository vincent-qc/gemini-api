/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, } from '@google/genai';
import { createCodeAssistContentGenerator } from '../code_assist/codeAssist.js';
import { DEFAULT_GEMINI_MODEL } from '../config/models.js';
import { getEffectiveModel } from './modelCheck.js';
export var AuthType;
(function (AuthType) {
    AuthType["LOGIN_WITH_GOOGLE"] = "oauth-personal";
    AuthType["USE_GEMINI"] = "gemini-api-key";
    AuthType["USE_VERTEX_AI"] = "vertex-ai";
})(AuthType || (AuthType = {}));
export async function createContentGeneratorConfig(model, authType, config) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
    const googleCloudLocation = process.env.GOOGLE_CLOUD_LOCATION;
    // Use runtime model from config if available, otherwise fallback to parameter or default
    const effectiveModel = config?.getModel?.() || model || DEFAULT_GEMINI_MODEL;
    const contentGeneratorConfig = {
        model: effectiveModel,
        authType,
    };
    // if we are using google auth nothing else to validate for now
    if (authType === AuthType.LOGIN_WITH_GOOGLE) {
        return contentGeneratorConfig;
    }
    if (authType === AuthType.USE_GEMINI && geminiApiKey) {
        contentGeneratorConfig.apiKey = geminiApiKey;
        contentGeneratorConfig.model = await getEffectiveModel(contentGeneratorConfig.apiKey, contentGeneratorConfig.model);
        return contentGeneratorConfig;
    }
    if (authType === AuthType.USE_VERTEX_AI &&
        !!googleApiKey &&
        googleCloudProject &&
        googleCloudLocation) {
        contentGeneratorConfig.apiKey = googleApiKey;
        contentGeneratorConfig.vertexai = true;
        contentGeneratorConfig.model = await getEffectiveModel(contentGeneratorConfig.apiKey, contentGeneratorConfig.model);
        return contentGeneratorConfig;
    }
    return contentGeneratorConfig;
}
export async function createContentGenerator(config, sessionId) {
    const version = process.env.CLI_VERSION || process.version;
    const httpOptions = {
        headers: {
            'User-Agent': `GeminiCLI/${version} (${process.platform}; ${process.arch})`,
        },
    };
    if (config.authType === AuthType.LOGIN_WITH_GOOGLE) {
        return createCodeAssistContentGenerator(httpOptions, config.authType, sessionId);
    }
    if (config.authType === AuthType.USE_GEMINI ||
        config.authType === AuthType.USE_VERTEX_AI) {
        const googleGenAI = new GoogleGenAI({
            apiKey: config.apiKey === '' ? undefined : config.apiKey,
            vertexai: config.vertexai,
            httpOptions,
        });
        return googleGenAI.models;
    }
    throw new Error(`Error creating contentGenerator: Unsupported authType: ${config.authType}`);
}
//# sourceMappingURL=contentGenerator.js.map