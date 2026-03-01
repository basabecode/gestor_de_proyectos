import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

export function useAIAssistant(board) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const buildBoardContext = useCallback(() => {
    if (!board) return {};
    return {
      name: board.name,
      description: board.description,
      groups: board.groups,
      items: board.items,
      columns: board.columns,
    };
  }, [board]);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || loading) return;

      const userMessage = { role: 'user', content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setLoading(true);
      setStreamingContent('');

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch(EDGE_FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${
              session?.access_token ||
              import.meta.env.VITE_SUPABASE_ANON_KEY
            }`,
          },
          body: JSON.stringify({
            messages: newMessages,
            boardContext: buildBoardContext(),
          }),
        });

        if (!response.ok) {
          const err = await response
            .json()
            .catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(err.error || `HTTP ${response.status}`);
        }

        // Parse Anthropic's SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (
                parsed.type === 'content_block_delta' &&
                parsed.delta?.type === 'text_delta' &&
                parsed.delta?.text
              ) {
                assistantContent += parsed.delta.text;
                setStreamingContent(assistantContent);
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: assistantContent },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Error: ${error.message}.\n\nVerifica que el asistente esté desplegado y que la clave de API esté configurada.`,
          },
        ]);
      } finally {
        setLoading(false);
        setStreamingContent('');
      }
    },
    [messages, loading, buildBoardContext],
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
  }, []);

  const summarize = useCallback(
    () =>
      sendMessage(
        'Resume el estado actual de este proyecto. ¿Cuál es el progreso general, qué está en riesgo y qué necesita atención inmediata?',
      ),
    [sendMessage],
  );

  const detectRisks = useCallback(
    () =>
      sendMessage(
        'Analiza los datos del tablero y detecta los principales riesgos del proyecto. Ordena de mayor a menor impacto e indica cómo mitigar cada uno.',
      ),
    [sendMessage],
  );

  const suggestTasks = useCallback(
    () =>
      sendMessage(
        'Basándote en el progreso actual, ¿qué nuevas tareas recomendarías agregar para desbloquear el avance? Usa el formato: "Tarea: [nombre] | Grupo: [grupo] | Prioridad: [alta/media/baja]"',
      ),
    [sendMessage],
  );

  return {
    messages,
    loading,
    streamingContent,
    sendMessage,
    clearHistory,
    summarize,
    detectRisks,
    suggestTasks,
  };
}
