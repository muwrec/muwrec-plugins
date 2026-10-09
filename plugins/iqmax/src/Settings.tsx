import { plugin } from "@vendetta";
import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, Stack, TableRow } = findByProps("TableRowGroup", "Stack", "TableRow");
const { TextInput } = findByProps("TextInput");

const DEFAULT_PROMPT =
    "Перепиши данный текст, будто ты псевдоинтеллектуал и используй научную, юридическую, техническую, узкоспециализированную лексику, если она подходит по контексту. Сохрани исходный смысл, язык и намерение автора. Не добавляй пояснений, предисловий, кавычек или комментариев — верни только переписанный текст.";

const get = (key: string, fallback: any = "") => plugin.storage[key] ?? fallback;
const set = (key: string, value: any) => { plugin.storage[key] = value; };

export default function Settings() {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);
    const update = (key: string, value: any) => {
        set(key, value);
        forceUpdate();
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
            <Stack spacing={10}>
                <TableRowGroup title="OpenAI-compatible API">
                    <Stack spacing={8}>
                        <TextInput
                            placeholder="Base URL, e.g. https://api.openai.com/v1"
                            value={get("baseUrl", "https://api.openai.com/v1")}
                            onChange={(v: string) => update("baseUrl", v)}
                            isClearable
                            autoCapitalize="none"
                        />
                        <TextInput
                            placeholder="API key (optional for local APIs)"
                            value={get("apiKey")}
                            onChange={(v: string) => update("apiKey", v)}
                            secureTextEntry
                            isClearable
                            autoCapitalize="none"
                        />
                        <TextInput
                            placeholder="Model, e.g. gpt-4o-mini"
                            value={get("model", "gpt-4o-mini")}
                            onChange={(v: string) => update("model", v)}
                            isClearable
                            autoCapitalize="none"
                        />
                        <TableRow
                            label="Endpoint format"
                            subLabel="POST {Base URL}/chat/completions with Bearer authentication and JSON messages."
                        />
                    </Stack>
                </TableRowGroup>
                <TableRowGroup title="System prompt">
                    <TextInput
                        placeholder={DEFAULT_PROMPT}
                        value={get("prompt", DEFAULT_PROMPT)}
                        onChange={(v: string) => update("prompt", v)}
                        multiline
                    />
                    <TableRow
                        label="Reset prompt"
                        subLabel="Restore the default pseudo-intellectual rewrite prompt."
                        onPress={() => {
                            update("prompt", DEFAULT_PROMPT);
                            showToast("Prompt restored.");
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title="Generation">
                    <Stack spacing={8}>
                        <TextInput
                            placeholder="Temperature (0–2; default 0.8)"
                            value={String(get("temperature", 0.8))}
                            onChange={(v: string) => {
                                const n = Number(v);
                                if (v.trim() && Number.isFinite(n)) update("temperature", Math.max(0, Math.min(2, n)));
                            }}
                            keyboardType="decimal-pad"
                        />
                        <TextInput
                            placeholder="Max tokens (default 1200)"
                            value={String(get("maxTokens", 1200))}
                            onChange={(v: string) => {
                                const n = Number(v);
                                if (v.trim() && Number.isFinite(n) && n > 0) update("maxTokens", Math.min(8192, Math.round(n)));
                            }}
                            keyboardType="numeric"
                        />
                    </Stack>
                </TableRowGroup>
                <TableRowGroup title="Privacy">
                    <TableRow
                        label="API key and message contents"
                        subLabel="The key is stored in local plugin storage. Text and the system prompt are sent to the API endpoint you configure; use only a trusted HTTPS provider."
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
