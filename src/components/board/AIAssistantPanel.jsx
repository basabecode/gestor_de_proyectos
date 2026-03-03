import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Trash2,
  Send,
  Sparkles,
  AlertTriangle,
  ListPlus,
  Loader2,
} from 'lucide-react';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { cn } from '../../lib/utils';

const QUICK_ACTIONS = [
  {
    label: 'Resumir proyecto',
    icon: Sparkles,
    key: 'summarize',
    description: 'Estado general y prioridades',
  },
  {
    label: 'Detectar riesgos',
    icon: AlertTriangle,
    key: 'detectRisks',
    description: 'Análisis de bloqueos y riesgos',
  },
  {
    label: 'Sugerir tareas',
    icon: ListPlus,
    key: 'suggestTasks',
    description: 'Próximos pasos recomendados',
  },
];

export default function AIAssistantPanel({ board, onClose }) {
  const {
    messages,
    loading,
    streamingContent,
    sendMessage,
    clearHistory,
    summarize,
    detectRisks,
    suggestTasks,
  } = useAIAssistant(board);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const actionHandlers = { summarize, detectRisks, suggestTasks };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-30 sm:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-95 bg-white border-l border-border-light shadow-2xl z-40 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-gradient-to-r from-primary/5 to-transparent shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary leading-tight">
                Asistente IA
              </h3>
              <p className="text-[10px] text-text-disabled">Powered by Claude</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="p-1.5 hover:bg-surface-secondary rounded transition-colors"
                title="Limpiar conversación"
              >
                <Trash2 className="w-3.5 h-3.5 text-text-secondary" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-secondary rounded transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {/* Empty state */}
          {messages.length === 0 && !loading && (
            <div className="text-center py-8 px-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <p className="text-[14px] font-semibold text-text-primary mb-1">
                ¿En qué te ayudo?
              </p>
              <p className="text-[12px] text-text-secondary max-w-65 mx-auto leading-relaxed">
                Analizo el estado de tu proyecto y te ayudo a tomar mejores
                decisiones.
              </p>
            </div>
          )}

          {/* Message history */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}

          {/* Streaming message */}
          {loading && streamingContent && (
            <MessageBubble
              role="assistant"
              content={streamingContent}
              streaming
            />
          )}

          {/* Loading spinner (before first token) */}
          {loading && !streamingContent && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-surface-secondary rounded-lg rounded-tl-none px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="text-[12px] text-text-secondary">
                    Analizando...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions — only when empty */}
        {messages.length === 0 && (
          <div className="px-4 pb-3 space-y-1.5 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled px-0.5 mb-2">
              Acciones rápidas
            </p>
            {QUICK_ACTIONS.map(({ label, icon: Icon, key, description }) => (
              <button
                key={key}
                onClick={() => actionHandlers[key]()}
                disabled={loading}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border-light hover:border-primary hover:bg-primary/5 text-left transition-all disabled:opacity-50 group"
              >
                <Icon className="w-4 h-4 text-text-disabled group-hover:text-primary shrink-0 transition-colors" />
                <div>
                  <p className="text-[12px] font-medium text-text-primary group-hover:text-primary transition-colors">
                    {label}
                  </p>
                  <p className="text-[10px] text-text-disabled">{description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border-light shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe una pregunta sobre el proyecto..."
              rows={1}
              disabled={loading}
              className="flex-1 text-[13px] resize-none border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 overflow-y-auto"
              style={{ minHeight: '38px', maxHeight: '96px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Enviar"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <p className="text-[10px] text-text-disabled mt-1.5 text-center">
            La IA puede cometer errores. Verifica información importante.
          </p>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ role, content, streaming = false }) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex items-start gap-2', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold',
          isUser ? 'bg-primary text-white' : 'bg-primary/10 text-primary',
        )}
      >
        {isUser ? 'Tú' : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'rounded-lg px-3 py-2 max-w-70 text-[12px] leading-relaxed',
          isUser
            ? 'bg-primary text-white rounded-tr-none'
            : 'bg-surface-secondary text-text-primary rounded-tl-none',
        )}
      >
        <FormattedContent content={content} isUser={isUser} />
        {streaming && (
          <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 align-middle animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}

function FormattedContent({ content, isUser }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        // Bold **text**
        if (/^\*\*(.+)\*\*$/.test(line)) {
          return (
            <p key={i} className="font-semibold">
              {line.slice(2, -2)}
            </p>
          );
        }
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span
                className={cn(
                  'mt-2 w-1 h-1 rounded-full shrink-0',
                  isUser ? 'bg-white/70' : 'bg-primary',
                )}
              />
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        // Empty line → small spacer
        if (line.trim() === '') return <div key={i} className="h-0.5" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
