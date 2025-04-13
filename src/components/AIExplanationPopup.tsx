import { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cpu, Send, ChevronRight, Minimize, Maximize, X, Tag, Square, Expand, Shrink, ChevronsUp } from "lucide-react";
import { sendAIRequest } from '@/utils/aiApiClient';
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { motion } from "framer-motion";

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

interface SectionTag {
  id: string;
  name: string;
  getContext: () => any;
}

interface AIExplanationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cardContext: any;
  section: string;
  availableSections?: {[key: string]: SectionTag};
}

export function AIExplanationPopup({ 
  isOpen, 
  onClose, 
  title,
  cardContext, 
  section,
  availableSections = {}
}: AIExplanationPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [position, setPosition] = useState({ x: 100, y: 0 });
  const [tagSuggestions, setTagSuggestions] = useState<SectionTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<SectionTag[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dragConstraintsRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      abortControllerRef.current = new AbortController();
      if (Object.keys(cardContext || {}).length > 0) {
        handleInitialQuestion();
      }
    } else if (!isOpen) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [isOpen, cardContext]);

  // Reset to fullscreen mode when opened
  useEffect(() => {
    if (isOpen) {
      setIsFullscreen(true);
      setIsMinimized(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Update tag suggestions when input changes
  useEffect(() => {
    // Check if input contains '@' character
    if (!input || !cursorPosition) {
      setTagSuggestions([]);
      return;
    }

    const textBeforeCursor = input.substring(0, cursorPosition);
    const lastAtSignIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSignIndex === -1) {
      setTagSuggestions([]);
      return;
    }
    
    // Get the partial tag text after the @ symbol
    const partialTag = textBeforeCursor.substring(lastAtSignIndex + 1).toLowerCase();
    
    // Only show suggestions if we're right after an @ or have started typing a tag
    if (lastAtSignIndex === cursorPosition - 1 || partialTag.length > 0) {
      // Filter available sections based on the partial tag
      const sections = Object.values(availableSections).filter(section => 
        section.name.toLowerCase().includes(partialTag)
      );
      
      setTagSuggestions(sections);
    } else {
      setTagSuggestions([]);
    }
  }, [input, cursorPosition, availableSections]);

  const processStream = async (userContent: string) => {
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: userContent };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setSelectedTags([]);

    // Extract tags from content and collect additional context
    const additionalContext = {};
    
    // Extract all @tags from user content
    const tagMatches = userContent.match(/@(\w+)/g);
    if (tagMatches) {
      console.log('Found tag matches:', tagMatches);
      tagMatches.forEach(tagMatch => {
        const tagName = tagMatch.substring(1); // Remove the @ symbol
        console.log('Looking for section with name:', tagName);
        const section = Object.values(availableSections).find(
          s => s.name.toLowerCase() === tagName.toLowerCase()
        );
        
        if (section) {
          console.log('Found matching section:', section.id);
          // Add the section's context to the additional context
          additionalContext[section.id] = section.getContext();
        } else {
          console.log('No matching section found for tag:', tagName);
        }
      });
    }

    try {
      const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
      
      // Merge the current card context with any additional tagged contexts
      const expandedContext = {
        ...cardContext,
        ...additionalContext,
        taggedSections: Object.keys(additionalContext)
      };
      
      console.log('Sending expanded context to API:', expandedContext);
      console.log('Tagged sections:', Object.keys(additionalContext));
      
      const response = await sendAIRequest({ 
        messages: apiMessages,
        cardContext: expandedContext
      });

      console.log('API response received:', response.status, response.statusText);
      
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
      
      console.log('Starting to read response stream');

      while (!done) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('Stream reading aborted.');
          reader.cancel();
          break;
        }
        
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (done) {
          console.log('Stream reading completed');
        }

        if (value) {
          const decodedChunk = decoder.decode(value, { stream: true });
          currentChunk += decodedChunk;
          
          // Log the raw chunk for debugging
          console.log('Received raw chunk from stream:', decodedChunk);
          
          const lines = currentChunk.split('\n');
          currentChunk = lines.pop() || '';

          let shouldUpdate = false;
          let newDeltaContent = '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataContent = line.substring(6).trim();
              if (dataContent === '[DONE]') {
                console.log('Received [DONE] signal');
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
                } else {
                  console.log('No delta content in parsed data:', parsed);
                }
              } catch (e) {
                console.error('JSON Parse Error:', e, 'for line:', dataContent);
              }
            } else if (line.trim()) {
              console.log('Unexpected line format (not starting with data:):', line);
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

      // Check if we received any content at all after stream processing
      if (!accumulatedContent && !currentChunk) {
        console.warn('No content was accumulated during stream processing');
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '') {
            return [
              ...prev.slice(0, -1),
              { role: 'assistant', content: 'Sorry, I was unable to generate a response. Please try again.' }
            ];
          } else {
            return prev;
          }
        });
      }

      // Process any remaining content
      if (currentChunk && currentChunk.startsWith('data: ')) {
        const dataContent = currentChunk.substring(6).trim();
        if (dataContent !== '[DONE]') {
          try {
            console.log('Processing final chunk:', dataContent);
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
        
        // Attempt to get more details about the error
        let errorDetails = error.message || 'Unknown error';
        
        if (error.response) {
          try {
            console.error('Error response details:', {
              status: error.response.status,
              statusText: error.response.statusText,
              headers: Object.fromEntries([...error.response.headers.entries()]),
            });
            
            // Try to read the response body for more error details
            error.response.text().then((text: string) => {
              console.error('Error response body:', text);
            }).catch((e: any) => {
              console.error('Could not read error response body:', e);
            });
            
            errorDetails = `Server error: ${error.response.status} ${error.response.statusText}`;
          } catch (e) {
            console.error('Failed to extract error response details:', e);
          }
        }
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '') {
            return [
              ...prev.slice(0, -1),
              { role: 'assistant', content: `Sorry, an error occurred: ${errorDetails}. Please try again.` }
            ];
          } else {
            return [...prev, { 
              role: 'assistant', 
              content: `Sorry, an error occurred: ${errorDetails}. Please try again.`
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

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsFullscreen(false);
    // Reset position to right side when minimizing
    setPosition({ x: 100, y: 0 });
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    // Keep on right side
    setPosition({ x: 100, y: 0 });
  };
  
  const handleFullscreen = () => {
    setIsFullscreen(true);
    setIsMinimized(false);
    // Reset position when going fullscreen
    setPosition({ x: 100, y: 0 });
  };
  
  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    // Ensure proper positioning when exiting fullscreen mode
    setPosition({ x: 100, y: 50 });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle selection from tag suggestions with arrow keys and enter
    if (tagSuggestions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent cursor movement
      } else if (e.key === 'Escape') {
        setTagSuggestions([]);
      } else if (e.key === 'Enter' && !e.shiftKey && tagSuggestions.length > 0) {
        e.preventDefault();
        insertTag(tagSuggestions[0]);
      }
    }
    
    // Update cursor position for @ detection
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const insertTag = (tag: SectionTag) => {
    if (!inputRef.current || cursorPosition === null) return;
    
    const textBeforeCursor = input.substring(0, cursorPosition);
    const lastAtSignIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSignIndex === -1) return;
    
    // Replace the @partialTag with the full tag
    const newInput = 
      input.substring(0, lastAtSignIndex) + 
      `@${tag.name}` + 
      input.substring(cursorPosition);
    
    setInput(newInput);
    setTagSuggestions([]);
    
    // Add to selected tags if not already included
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    
    // Focus back on input and set cursor after the inserted tag
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = lastAtSignIndex + tag.name.length + 1;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  if (!isOpen) return null;

  // Determine position and size based on state
  const getContainerStyles = () => {
    if (isFullscreen) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      } as const;
    }
    
    return {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      pointerEvents: 'none'
    } as const;
  };
  
  const getContentStyles = () => {
    if (isFullscreen) {
      return {
        x: 0,
        y: 0,
        position: 'relative',
        width: '90vw',
        maxWidth: '800px',
        height: '80vh',
        maxHeight: '80vh'
      } as const;
    }
    
    if (isMinimized) {
      return {
        x: position.x,
        y: position.y,
        position: 'fixed',
        top: 'auto',
        right: '90px', // Further increased right padding
        left: 'auto',
        bottom: '80px',
        transform: 'none',
        zIndex: 50
      } as const;
    }
    
    return {
      x: position.x,
      y: position.y,
      position: 'fixed',
      bottom: '120px',
      top: 'auto',
      right: '80px', // Further increased right padding
      left: 'auto',
      transform: 'none',
      zIndex: 50,
      maxWidth: '480px',
      height: 'auto',
      maxHeight: 'calc(100vh - 200px)',
      paddingRight: '12px' // Add padding for scrollbar
    } as const;
  };

  return (
    <div ref={dragConstraintsRef} style={getContainerStyles()}>
      <motion.div
        drag={!isFullscreen}
        dragConstraints={dragConstraintsRef}
        dragMomentum={false}
        dragElastic={0}
        dragTransition={{ power: 0, timeConstant: 0 }}
        className="pointer-events-auto absolute"
        initial={{ x: 0, y: 0 }}
        animate={isFullscreen ? { x: 0, y: 0 } : { x: position.x, y: position.y }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          duration: 0.3
        }}
        style={getContentStyles()}
        onDragEnd={(_, info) => {
          if (!isFullscreen) {
            setPosition({
              x: position.x + info.offset.x,
              y: position.y + info.offset.y
            });
          }
        }}
      >
        {isMinimized ? (
          <div className="bg-background rounded-full p-2 shadow-lg border cursor-pointer mr-1" onClick={handleMaximize}>
            <div className="flex items-center gap-2 px-3 py-1">
              <Cpu className="h-4 w-4" />
              <span className="text-sm font-medium">{title} Chat</span>
              <Expand className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div className={`bg-background border rounded-lg shadow-lg flex flex-col ${isFullscreen ? 'w-full h-full' : 'max-w-[500px] max-h-[80vh] flex flex-col mr-2'}`}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                <h3 className="text-lg font-semibold">{title} Explained</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleMinimize} className="h-8 w-8" title="Minimize">
                  <ChevronsUp className="h-4 w-4" />
                </Button>
                {isFullscreen ? (
                  <Button variant="ghost" size="icon" onClick={handleExitFullscreen} className="h-8 w-8" title="Exit Fullscreen">
                    <Shrink className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={handleFullscreen} className="h-8 w-8" title="Fullscreen">
                    <Expand className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className={`p-4 space-y-3 ${isFullscreen ? 'flex-1 overflow-hidden flex flex-col' : 'flex-1 overflow-auto flex flex-col min-h-[400px]'}`}>
              <p className="text-sm text-muted-foreground">
                AI-powered explanation and insights about {title.toLowerCase()}. Ask follow-up questions for more details.
                {Object.keys(availableSections).length > 0 && (
                  <span> Use <span className="bg-muted px-1 rounded">@SectionName</span> to include specific sections.</span>
                )}
              </p>
              
              <ScrollArea className={`${isFullscreen ? 'flex-1' : 'h-[300px] min-h-[250px]'} pr-4`}>
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
                        } ${message.role === 'assistant' && message.content === '' && isLoading ? 'min-h-[3rem]' : ''}`}
                      >
                        {message.role === 'assistant' ? (
                          message.content ? (
                            <MarkdownRenderer content={message.content} />
                          ) : isLoading ? (
                            <div className="flex items-center h-4 space-x-1 ml-1">
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-typing-dot-1"></span>
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-typing-dot-2"></span>
                              <span className="w-1.5 h-1.5 bg-current rounded-full animate-typing-dot-3"></span>
                            </div>
                          ) : null
                        ) : (
                          message.content
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
              
              {/* Selected tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <Badge key={tag.id} variant="outline" className="flex items-center gap-1 bg-muted">
                      <Tag className="h-3 w-3" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="flex w-full gap-2 relative mt-auto">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onClick={handleInputClick}
                    placeholder="Ask a follow-up question... Use @Section to reference other data"
                    disabled={isLoading}
                    className="flex-1"
                  />
                  
                  {/* Tag suggestions dropdown */}
                  {tagSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 bg-background border rounded-md shadow-md z-50 max-h-[120px] overflow-y-auto">
                      {tagSuggestions.map(tag => (
                        <div 
                          key={tag.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                          onClick={() => insertTag(tag)}
                        >
                          <Tag className="h-3 w-3" />
                          <span>{tag.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
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
            </div>
            
            <div className="text-xs text-muted-foreground text-center p-2 border-t">
              Powered by Gemini 2.0 Flash via OpenRouter
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
} 