import { registerCommand } from "@vendetta/commands";
import { plugin } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./Settings";

const MessageActions = findByProps("sendMessage");

const DEFAULT_PROMPT =
    "Перепиши данный текст, будто ты псевдоинтеллектуал и используй научную, юридическую, техническую, узкоспециализированную лексику, если она подходит по контексту. Сохрани исходный смысл, язык и намерение автора. Не добавляй пояснений, предисловий, кавычек или комментариев — верни только переписанный текст.";

type SettingsStore = {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
};

const settings = (): Required<SettingsStore> => {
    const s = plugin.storage as SettingsStore;
    return {
        baseUrl: s.baseUrl ?? "https://api.openai.com/v1",
        apiKey: s.apiKey ?? "",
        model: s.model ?? "gpt-4o-mini",
        prompt: s.prompt ?? DEFAULT_PROMPT,
        temperature: Number.isFinite(Number(s.temperature)) ? Number(s.temperature ?? 0.8) : 0.8,
        maxTokens: Number.isFinite(Number(s.maxTokens)) ? Number(s.maxTokens ?? 1200) : 1200,
    };
};

function endpointFromBaseUrl(baseUrl: string): string {
    const base = baseUrl.trim().replace(/\\/+$/, "");
    if (!/^https?:\\/\\//i.test(base)) {
        throw new Error("Base URL должен начинаться с https:// (или http:// для локального сервера).");
    }
    return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}

async function rewrite(input: string): Promise<string> {
    const cfg = settings();
    if (!cfg.baseUrl.trim()) throw new Error("Укажи Base URL в настройках IQMax.");
    if (!cfg.model.trim()) throw new Error("Укажи название модели в настройках IQMax.");
    if (!cfg.prompt.trim()) throw new Error("System prompt не должен быть пустым.");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cfg.apiKey.trim()) headers.Authorization = `Bearer ${cfg.apiKey.trim()}`;

    const response = await fetch(endpointFromBaseUrl(cfg.baseUrl), {
        method: "POST",
        headers,
        body: JSON.stringify({
            model: cfg.model.trim(),
            messages: [
                { role: "system", content: cfg.prompt },
                { role: "user", content: input },
            ],
            temperature: Math.max(0, Math.min(2, Number(cfg.temperature) || 0)),
            max_tokens: Math.max(1, Math.min(8192, Math.round(Number(cfg.maxTokens) || 1200))),
        }),
    });

    const raw = await response.text();
    let data: any;
    try {
        data = JSON.parse(raw);
    } catch {
        throw new Error(`API вернул некорректный ответ (HTTP ${response.status}). Проверь URL.`);
    }

    if (!response.ok) {
        throw new Error(data?.error?.message ?? data?.message ?? `Ошибка API: HTTP ${response.status}`);
    }

    const result = data?.choices?.[0]?.message?.content;
    if (typeof result !== "string" || !result.trim()) {
        throw new Error("Ответ API не содержит choices[0].message.content.");
    }
    return result.trim();
}

function splitMessage(text: string, limit = 1900): string[] {
    const chunks: string[] = [];
    let rest = text;
    while (rest.length > limit) {
        let cut = rest.lastIndexOf("\n", limit);
        if (cut < limit * 0.5) cut = rest.lastIndexOf(" ", limit);
        if (cut < limit * 0.5) cut = limit;
        chunks.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
}

const iqmaxCommand = {
    name: "iqmax",
    displayName: "iqmax",
    description: "Rewrite text in a pseudo-intellectual style using your configured AI API.",
    displayDescription: "Rewrite text in a pseudo-intellectual style using your configured AI API.",
    options: [
        {
            name: "text",
            displayName: "text",
            description: "Text to rewrite",
            displayDescription: "Text to rewrite",
            type: 3,
            required: true,
        },
    ],
    execute: async (args: any[], ctx: any) => {
        const text = args?.find((arg) => arg.name === "text")?.value;
        if (typeof text !== "string" || !text.trim()) {
            showToast("Enter text to rewrite.");
            return null;
        }

        try {
            showToast("IQMax: rewriting…");
            const result = await rewrite(text.trim());
            for (const chunk of splitMessage(result)) {
                MessageActions.sendMessage(
                    ctx.channel.id,
                    { content: chunk },
                    void 0,
                    { nonce: Date.now().toString() },
                );
            }
        } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            showToast(`IQMax: ${message}`.slice(0, 180));
        }
        return null;
    },
    applicationId: "-1",
    inputType: 1,
    type: 1,
};

let unregisterCommand: (() => void) | undefined;

export default {
    onLoad: () => {
        if (plugin.storage.prompt === undefined) plugin.storage.prompt = DEFAULT_PROMPT;
        unregisterCommand = registerCommand(iqmaxCommand as any);
    },
    onUnload: () => {
        unregisterCommand?.();
        unregisterCommand = undefined;
    },
    settings: Settings,
};
