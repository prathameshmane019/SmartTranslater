'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftRight, Volume2, Copy, File, Star, Trash2, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

function debounce(func, wait) {
  let timeout = null;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export default function AdvancedTranslator() {
  const [inputText, setInputText] = useState('')
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('en')
  const [translatedText, setTranslatedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [languages, setLanguages] = useState({})
  const [autoDetect, setAutoDetect] = useState(true)
  const [detectedLanguage, setDetectedLanguage] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [history, setHistory] = useState([])
  const [favorites, setFavorites] = useState([])
  const [error, setError] = useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchLanguages()
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme, mounted])

  const fetchLanguages = async () => {
    try {
      const response = await fetch('http://localhost:8000/languages')
      const data = await response.json()
      setLanguages(data)
    } catch (error) {
      console.log('Error fetching languages:', error)
      setError('Failed to fetch languages. Please try again later.')
    }
  }

  const handleTranslate = useCallback(debounce(async (text) => {
    if (!text) return
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:8000/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          source_lang: autoDetect ? 'auto' : sourceLang,
          target_lang: targetLang,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setTranslatedText(data.translated_text)
        setDetectedLanguage(data.detected_language)
        setConfidence(data.confidence)
        setHistory(prev => [{ input: text, output: data.translated_text, from: data.detected_language, to: targetLang }, ...prev.slice(0, 9)])
      } else {
        throw new Error(data.detail || 'Translation failed')
      }
    } catch (error) {
      console.log('Translation error:', error)
      setError('Translation failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, 500), [autoDetect, sourceLang, targetLang])

  useEffect(() => {
    handleTranslate(inputText)
  }, [inputText, handleTranslate])

  const handleSwapLanguages = () => {
    if (!autoDetect) {
      const temp = sourceLang
      setSourceLang(targetLang)
      setTargetLang(temp)
      setInputText(translatedText)
      setTranslatedText(inputText)
    }
  }

  const handleTextToSpeech = (text, lang) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Find a voice that matches the language code or its first two characters
      const voice = voices.find(v => v.lang.startsWith(lang)) || 
                    voices.find(v => v.lang.startsWith(lang.slice(0, 2))) ||
                    voices[0];
      
      utterance.voice = voice;
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('Text-to-speech not supported in this browser.');
      setError('Text-to-speech is not supported in your browser.');
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setInputText(e.target.result)
      }
      reader.readAsText(file)
    }
  }

  const toggleFavorite = (item) => {
    const index = favorites.findIndex(fav => fav.input === item.input && fav.output === item.output)
    if (index === -1) {
      setFavorites([item, ...favorites])
    } else {
      setFavorites(favorites.filter((_, i) => i !== index))
    }
  }

  const isFavorite = (item) => {
    return favorites.some(fav => fav.input === item.input && fav.output === item.output)
  }

  if (!mounted) return null

  return (
    <Card className="w-full max-w-4xl mx-auto my-5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Advanced Translator</CardTitle>
     
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="translate">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="translate">Translate</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          <TabsContent value="translate" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-detect"
                  checked={autoDetect}
                  onCheckedChange={setAutoDetect}
                />
                <Label htmlFor="auto-detect">Auto-detect language</Label>
              </div>
              <Button onClick={handleSwapLanguages} disabled={autoDetect}>
                <ArrowLeftRight className="mr-2 h-4 w-4" /> Swap
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sourceLang">Source Language</Label>
                <Select value={sourceLang} onValueChange={setSourceLang} disabled={autoDetect}>
                  <SelectTrigger id="sourceLang">
                    <SelectValue placeholder="Select source language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(languages).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetLang">Target Language</Label>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger id="targetLang">
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(languages).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inputText">Text to Translate</Label>
              <div className="relative">
                <Textarea
                  id="inputText"
                  placeholder="Enter text to translate"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                />
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleTextToSpeech(inputText, sourceLang)}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(inputText)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Input id="file-upload" type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                    <File className="h-4 w-4" />
                  </label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Character count: {inputText.length} | Word count: {inputText.trim().split(/\s+/).length}
              </p>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {isLoading && <p>Translating...</p>}
            {translatedText && (
              <div className="space-y-2">
                <Label htmlFor="translatedText">Translated Text</Label>
                <div className="relative">
                  <Textarea
                    id="translatedText"
                    value={translatedText}
                    readOnly
                    rows={4}
                  />
                  <div className="absolute bottom-2 right-2 flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleTextToSpeech(translatedText, targetLang)}>
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(translatedText)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Character count: {translatedText.length} | Word count: {translatedText.trim().split(/\s+/).length}
                </p>
                {autoDetect && detectedLanguage && (
                  <p className="text-sm text-muted-foreground">
                    Detected language: {languages[detectedLanguage]} (Confidence: {(confidence * 100).toFixed(2)}%)
                  </p>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="history">
            <div className="space-y-4">
              {history.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <p className="font-semibold">{languages[item.from]} → {languages[item.to]}</p>
                    <p>{item.input}</p>
                    <p className="mt-2">{item.output}</p>
                    <div className="mt-2 flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleFavorite(item)}>
                        <Star className={`h-4 w-4 ${isFavorite(item) ? 'fill-yellow-400' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(item.output)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="favorites">
            <div className="space-y-4">
              {favorites.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <p className="font-semibold">{languages[item.from]} → {languages[item.to]}</p>
                    <p>{item.input}</p>
                    <p className="mt-2">{item.output}</p>
                    <div className="mt-2 flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleFavorite(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(item.output)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}