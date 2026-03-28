type AssistantMemory = {
  lastMessages: string[];
  lastTopic: string | null;
  lastExplanation: string | null;
  lastKnowledgeKeys: string[];
};

let memory: AssistantMemory = {
  lastMessages: [],
  lastTopic: null,
  lastExplanation: null,
  lastKnowledgeKeys: []
};

export function updateMemory(
  userMessage: string,
  assistantMessage: string,
  topic: string,
  explanation: string,
  knowledgeKeys: string[],
  options?: { preserveContext?: boolean }
) {
  memory.lastMessages.push(`user: ${userMessage}`, `assistant: ${assistantMessage}`);

  while (memory.lastMessages.length > 5) {
    memory.lastMessages.shift();
  }

  if (!options?.preserveContext) {
    memory.lastTopic = topic;
    memory.lastExplanation = explanation;
    memory.lastKnowledgeKeys = knowledgeKeys;
  }
}

export function seedMemory(message: string) {
  if (!memory.lastMessages.length) {
    memory.lastMessages = [`assistant: ${message}`];
  }
}

export function getMemory() {
  return memory;
}

export function resetMemory() {
  memory = {
    lastMessages: [],
    lastTopic: null,
    lastExplanation: null,
    lastKnowledgeKeys: []
  };
}
