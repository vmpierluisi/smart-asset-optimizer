import { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cpu, Send, ChevronRight } from "lucide-react";
import { sendAIRequest } from '@/utils/aiApiClient';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

interface AIExplanationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cardContext: any;
  section: string;
}

export function AIExplanationPopup({ 
  isOpen, 
  onClose, 
  title,
  cardContext, 
  section 
}: AIExplanationPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      abortControllerRef.current = new AbortController();
      if (Object.keys(cardContext || {}).length > 0) {
        handleInitialQuestion();
      }
    } else {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [isOpen, cardContext]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const processStream = async (userContent: string) => {
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: userContent };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');

    try {
      const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
      
      const response = await sendAIRequest({ 
        messages: apiMessages,
        cardContext
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let currentChunk = '';
      let accumulatedContent = '';
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 50; // Update UI every 50ms minimum

      while (!done) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('Stream reading aborted.');
          reader.cancel();
          break;
        }
        
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const decodedChunk = decoder.decode(value, { stream: true });
          currentChunk += decodedChunk;
          
          const lines = currentChunk.split('\n');
          currentChunk = lines.pop() || '';

          let shouldUpdate = false;
          let newDeltaContent = '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataContent = line.substring(6).trim();
              if (dataContent === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataContent);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  accumulatedContent += delta;
                  newDeltaContent += delta;
                  shouldUpdate = true;
                }
              } catch (e) {
                console.error('JSON Parse Error:', e);
              }
            }
          }

          // Throttle UI updates for smoother experience
          const currentTime = Date.now();
          if (shouldUpdate && (currentTime - lastUpdateTime > UPDATE_INTERVAL || done)) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: accumulatedContent }
                ];
              } else {
                return [...prev, { role: 'assistant', content: accumulatedContent }];
              }
            });
            lastUpdateTime = currentTime;
          }
        }
      }

      // Process any remaining content
      if (currentChunk && currentChunk.startsWith('data: ')) {
        const dataContent = currentChunk.substring(6).trim();
        if (dataContent !== '[DONE]') {
          try {
            const parsed = JSON.parse(dataContent);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulatedContent += delta;
              setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: accumulatedContent }
                  ];
                }
                return prev;
              });
            }
          } catch (e) {
            console.warn('Could not parse final stream data chunk:', e);
          }
        }
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error processing stream:', error);
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '') {
            return [
              ...prev.slice(0, -1),
              { role: 'assistant', content: `Sorry, an error occurred: ${error.message}. Please try again.` }
            ];
          } else {
            return [...prev, { 
              role: 'assistant', 
              content: `Sorry, an error occurred: ${error.message}. Please try again.`
            }];
          }
        });
      }
    } finally {
      if (!(abortControllerRef.current?.signal.aborted)) {
        setIsLoading(false);
      }
    }
  };

  const handleInitialQuestion = async () => {
    const initialQuestion = `Please explain the ${title.toLowerCase()} data and what it means.`;
    await processStream(initialQuestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      processStream(input.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col" aria-describedby="ai-explanation-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            <span>{title} Explained</span>
          </DialogTitle>
          <DialogDescription id="ai-explanation-description">
            AI-powered explanation and insights about {title.toLowerCase()}. Ask follow-up questions for more details.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 my-4 h-[300px]">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`px-4 py-2 rounded-lg max-w-[80%] ${message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  } ${message.role === 'assistant' && message.content === '' && isLoading ? 'min-h-[2rem]' : ''}`}
                >
                  {message.content}
                  {message.role === 'assistant' && message.content === '' && isLoading && (
                    <div className="flex items-center h-4 space-x-1 ml-1">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-typing-dot-1"></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-typing-dot-2"></span>
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-typing-dot-3"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {messages.length === 0 && isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-primary rounded-full animate-typing-dot-1"></span>
                  <span className="w-3 h-3 bg-primary rounded-full animate-typing-dot-2"></span>
                  <span className="w-3 h-3 bg-primary rounded-full animate-typing-dot-3"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex sm:justify-between items-center">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <div className="flex items-center space-x-1">
                  <span className="w-1 h-1 bg-background rounded-full animate-typing-dot-1"></span>
                  <span className="w-1 h-1 bg-background rounded-full animate-typing-dot-2"></span>
                  <span className="w-1 h-1 bg-background rounded-full animate-typing-dot-3"></span>
                </div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </DialogFooter>
        
        <div className="text-xs text-muted-foreground text-center mt-2">
          Powered by Gemini 2.0 Flash via OpenRouter
        </div>
      </DialogContent>
    </Dialog>
  );
} 