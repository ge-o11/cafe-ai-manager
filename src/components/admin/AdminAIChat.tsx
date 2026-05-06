import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, ImagePlus, X, Bot, User, Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
}

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const AdminAIChat: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(generateId());
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load chat history from last 24 hours
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        // Use the session_id from the most recent message
        const lastSession = data[data.length - 1].session_id;
        setSessionId(lastSession);
        
        const loaded: ChatMessage[] = data.map((msg) => ({
          role: msg.role === 'admin' ? 'user' : 'assistant',
          content: msg.content,
          images: msg.images || undefined,
        }));
        setMessages(loaded);
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, [user]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const saveMessage = async (role: 'admin' | 'assistant', content: string, msgImages?: string[]) => {
    if (!user) return;
    await supabase.from('ai_chat_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      role,
      content,
      images: msgImages || [],
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImagePreviewUrls((prev) => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const ext = file.name?.split('.').pop() || 'png';
    const fileName = `${generateId()}.${ext}`;
    const filePath = `uploads/${fileName}`;
    const { error } = await supabase.storage
      .from('menu-images')
      .upload(filePath, file, { contentType: file.type });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if (!input.trim() && images.length === 0) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      images: imagePreviewUrls.length > 0 ? [...imagePreviewUrls] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const uploadedUrls: string[] = [];
      for (const image of images) {
        const url = await uploadImageToStorage(image);
        uploadedUrls.push(url);
      }

      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setImages([]);
      setImagePreviewUrls([]);

      // Save user message to DB
      await saveMessage('admin', currentInput, uploadedUrls.length > 0 ? uploadedUrls : undefined);

      // Build conversation history from DB-stored messages for context
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error('Session expired — please log in again');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-menu-chat', {
        body: {
          message: currentInput,
          imageUrls: uploadedUrls,
          conversationHistory,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        // Log full error details for debugging
        console.error('[AI Chat] invoke error object:', error);
        console.error('[AI Chat] error name:', (error as any)?.name);
        console.error('[AI Chat] error message:', (error as any)?.message);
        console.error('[AI Chat] error status:', (error as any)?.status);
        console.error('[AI Chat] error context:', (error as any)?.context);

        let errorMsg = '';
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            console.error('[AI Chat] error body:', body);
            errorMsg = body?.error || '';
          } else if (ctx) {
            const text = await ctx.text?.();
            console.error('[AI Chat] error body text:', text);
            try { const parsed = JSON.parse(text); errorMsg = parsed?.error || text; } catch { errorMsg = text; }
          }
        } catch (parseErr) {
          console.error('[AI Chat] failed to parse error body:', parseErr);
        }
        const displayMsg = errorMsg || (error as any)?.message || 'Unknown error';
        toast.error(displayMsg);
        const errChat: ChatMessage = { role: 'assistant', content: displayMsg };
        setMessages((prev) => [...prev, errChat]);
        await saveMessage('assistant', displayMsg);
        return;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to DB
      await saveMessage('assistant', data.response);

      if (data.actionsApplied) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        queryClient.invalidateQueries({ queryKey: ['hero-images'] });
        queryClient.invalidateQueries({ queryKey: ['hero-images-public'] });
        toast.success(t('ai.success'));
      }
    } catch (err: any) {
      console.error('[AI Chat] catch error:', err);
      let displayMsg = t('ai.error');
      try {
        const ctx = err?.context;
        if (ctx) {
          const body = await ctx.clone().json().catch(() => null);
          console.error('[AI Chat] error body:', body);
          if (body?.error) displayMsg = body.error;
        }
        if (err?.status === 401 || err?.message?.includes('401')) {
          displayMsg = 'Session expired — please log out and log in again.';
        }
      } catch (e) { /* ignore */ }
      toast.error(displayMsg);
      const errorMessage: ChatMessage = { role: 'assistant', content: displayMsg };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessage('assistant', displayMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((item) => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    e.preventDefault();
    imageItems.forEach((item) => {
      const file = item.getAsFile();
      if (!file) return;
      setImages((prev) => [...prev, file]);
      const url = URL.createObjectURL(file);
      setImagePreviewUrls((prev) => [...prev, url]);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-semibold">{t('admin.aiChat')}</h2>
        <Card className="h-[600px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-semibold">{t('admin.aiChat')}</h2>

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              AI Menu Assistant
            </CardTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  if (!user) return;
                  await supabase
                    .from('ai_chat_messages')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('session_id', sessionId);
                  setMessages([]);
                  setSessionId(generateId());
                  toast.success('Chat cleared');
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('admin.clear') || 'Clear'}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                <Bot className="h-12 w-12 text-accent mb-4" />
                <p className="text-muted-foreground mb-4">{t('ai.welcome')}</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="bg-secondary px-3 py-1 rounded-full">{t('ai.example1')}</p>
                  <p className="bg-secondary px-3 py-1 rounded-full">{t('ai.example2')}</p>
                  <p className="bg-secondary px-3 py-1 rounded-full">{t('ai.example3')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-accent-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {message.images && message.images.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {message.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded" />
                          ))}
                        </div>
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="bg-secondary rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {imagePreviewUrls.length > 0 && (
            <div className="flex gap-2 px-4 py-2 border-t">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
              <input type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" id="camera-input" />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => document.getElementById('camera-input')?.click()} disabled={isLoading} className="md:hidden">
                <Camera className="h-4 w-4" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={t('ai.placeholder')}
                className="min-h-[44px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || (!input.trim() && images.length === 0)}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAIChat;
