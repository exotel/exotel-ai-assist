import { Theme, Tabs, Flex, Box } from "@radix-ui/themes";
import { Lightbulb, FileText } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { useExotelAIAssist } from "../hooks/useExotelAIAssist";
import { ExotelAIAssistParams } from "../types";
import "../styles/index.css";
import { Header } from "./key-components/Header";
import { SuggestionsTab } from "./key-components/SuggestionTab";
import { TranscriptTab } from "./key-components/TranscriptTab";

export interface ExotelAIAssistProps extends ExotelAIAssistParams {
  className?: string;
}

export function ExotelAIAssist({ className, ...params }: ExotelAIAssistProps): JSX.Element {
  const { status, suggestions, transcripts, sentiment, botConfig } = useExotelAIAssist(params as ExotelAIAssistParams);

  const connected = status === "connected";

  return (
    <Theme className="oa-theme-root">
      <Box className={`oa-panel${className ? ` ${className}` : ""}`}>
        <Flex direction="column" style={{ flex: 1, width: "100%", minHeight: 0, padding: "0 16px" }}>
          <Header sentiment={sentiment} botConfig={botConfig} />

          <Tabs.Root defaultValue="suggestions" className="oa-tabs" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Tabs.List>
              <Tabs.Trigger value="suggestions" style={{ fontSize: "15px" }}>
                <Lightbulb size={16} />
                Suggestions
              </Tabs.Trigger>
              <Tabs.Trigger value="transcript" aria-label="Transcript" style={{ fontSize: "15px" }}>
                <FileText size={16} />
                Transcript
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="suggestions" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingTop: 16 }}>
              <SuggestionsTab suggestions={suggestions} connected={connected} botConfig={botConfig} />
            </Tabs.Content>

            <Tabs.Content value="transcript" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingTop: 16 }}>
              <TranscriptTab transcripts={transcripts} connected={connected} botConfig={botConfig} />
            </Tabs.Content>
          </Tabs.Root>
        </Flex>
      </Box>

      <Toaster position="bottom-center" />
    </Theme>
  );
}

export { ExotelAIAssist as ExotelAIAssistApp };
