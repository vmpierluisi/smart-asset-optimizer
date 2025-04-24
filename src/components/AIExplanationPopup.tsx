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
import { useSidebar } from "@/components/ui/sidebar";
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
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [position, setPosition] = useState({ x: 100, y: 0 });
  const [tagSuggestions, setTagSuggestions] = useState<SectionTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<SectionTag[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const dragConstraintsRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const hasAskedInitialQuestionRef = useRef<boolean>(false);

  // Handle component initialization and cleanup
  useEffect(() => {
    // Only initialize once when component mounts
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }

    // Cleanup function runs when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Handle popup open/close state changes - simplified to prevent infinite loops
  useEffect(() => {
    if (isOpen) {
      // When opening the popup
      setIsFullscreen(true);
      setIsMinimized(false);
      
      // Create new abort controller for API requests
      if (!abortControllerRef.current) {
        abortControllerRef.current = new AbortController();
      }
      
      // NOTE: We've removed the automatic initial question feature to prevent infinite loops
      
    } else {
      // When closing the popup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
      hasAskedInitialQuestionRef.current = false;
    }
  }, [isOpen]); // Only depend on isOpen

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Handle tag suggestions
  useEffect(() => {
    // Skip if no input or cursor position
    if (!input || cursorPosition === null) {
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

      // SIMPLIFIED STREAMING LOGIC
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      
      console.log('Starting to read response stream');

      // Create a loop that processes one chunk at a time
      while (true) {
        // Check if we need to abort
        if (abortControllerRef.current?.signal.aborted) {
          console.log('Stream reading aborted.');
          reader.cancel();
          break;
        }
        
        // Read the next chunk
        const { value, done } = await reader.read();
        
        // If we're done, exit the loop
        if (done) {
          console.log('Stream reading completed');
          break;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunk);
        
        try {
          // Process the chunk - split by newlines and look for data: lines
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) continue;
            
            // Handle data: lines
            if (line.startsWith('data: ')) {
              const content = line.substring(6).trim();
              
              // Handle the [DONE] signal
              if (content === '[DONE]') {
                console.log('Received [DONE] signal');
                continue;
              }
              
              try {
                // Parse the JSON content
                const parsed = JSON.parse(content);
                const delta = parsed.choices?.[0]?.delta?.content;
                
                if (delta) {
                  // Add the new content
                  accumulatedContent += delta;
                  
                  // Update the UI with the new content
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
                console.error('Error parsing JSON:', e, 'Line:', content);
              }
            } else {
              console.log('Unexpected line format:', line);
            }
          }
        } catch (e) {
          console.error('Error processing chunk:', e);
        }
      }
      
      // Check if we received any content
      if (!accumulatedContent) {
        console.warn('No content was accumulated during stream processing');
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '') {
            return [
              ...prev.slice(0, -1),
              { role: 'assistant', content: 'Sorry, I was unable to generate a response. Please try again.' }
            ];
          }
          return prev;
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error processing stream:', error);
        
        // Get error details
        const errorDetails = error.message || 'Unknown error';
        
        // Update the messages with the error
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

  // Initial question is now handled directly in the useEffect

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
  // Overlay matches AnalysisSidebar fullscreen overlay (doesn't cover AppSidebar)
const { state: appSidebarState } = useSidebar();
const getContainerStyles = () => {
    if (isFullscreen) {
    // Sidebar width: expanded = 16rem (256px), collapsed = 3rem (48px)
    const sidebarWidth = appSidebarState === "expanded" ? "16rem" : "3rem";
    return {
      position: "fixed" as const,
      top: 0,
      left: sidebarWidth,
      width: `calc(100vw - ${sidebarWidth})`,
      height: "100vh",
      zIndex: 50,
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      transition: "left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1), background 0.2s",
    };
  } else {
    return {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      pointerEvents: 'none'
    } as const;
  }
};

const getContentStyles = () => {
  if (isFullscreen) {
    return {
      x: 0,
      y: 0,
      position: 'relative',
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      maxHeight: '100%'
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
    {/* Overlay and container logic now matches AnalysisSidebar fullscreen */}
    <motion.div
      drag={!isFullscreen}
      dragConstraints={dragConstraintsRef}
      dragMomentum={false}
      dragElastic={0}
      dragTransition={{ power: 0, timeConstant: 0 }}
      className="pointer-events-auto absolute top-0 left-0 w-full"
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
        <div className={
          isFullscreen
            ? "max-w-2xl mx-auto rounded-xl border bg-background/95 backdrop-blur-lg flex flex-col w-full h-full shadow-xl"
            : "bg-background border rounded-lg shadow-lg flex flex-col max-w-[500px] max-h-[80vh] mr-2"
        }>
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
            <div className="flex justify-center items-center">
              <span>Powered by Gemini 2.0 Flash via OpenRouter</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  </div>
);
}