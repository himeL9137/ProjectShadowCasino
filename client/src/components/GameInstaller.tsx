import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, FileText, Image, Code, Play, CheckCircle, AlertCircle, 
  X, Plus, Gamepad2, Settings, Eye, Download, Trash2, BookOpen, Star, Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gameTemplates, GameTemplate, getTemplateById } from '@/lib/gameTemplates';

interface GameFile {
  file: File;
  preview?: string;
  type: 'game' | 'asset' | 'config';
}

interface GameInstallationForm {
  name: string;
  category: string;
  description: string;
  instructions: string;
  winChance: number;
  maxMultiplier: number;
  minBet: string;
  maxBet: string;
  tags: string[];
}

interface GameInstallerProps {
  onGameInstalled: () => void;
}

export function GameInstaller({ onGameInstalled }: GameInstallerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<GameFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentTab, setCurrentTab] = useState('templates');
  const [tagInput, setTagInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [showCodePreview, setShowCodePreview] = useState(false);
  
  const [form, setForm] = useState<GameInstallationForm>({
    name: '',
    category: 'casino',
    description: '',
    instructions: '',
    winChance: 50,
    maxMultiplier: 2.0,
    minBet: '1',
    maxBet: '1000',
    tags: []
  });

  const categories = [
    { value: 'casino', label: 'Casino Games' },
    { value: 'card', label: 'Card Games' },
    { value: 'puzzle', label: 'Puzzle Games' },
    { value: 'arcade', label: 'Arcade Games' },
    { value: 'strategy', label: 'Strategy Games' },
    { value: 'action', label: 'Action Games' }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    const validFiles: GameFile[] = [];
    
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isValidGameFile = ['html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'css', 'json'].includes(extension || '');
      const isValidAsset = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
      
      if (isValidGameFile) {
        // Try to read file content for preview
        const content = await file.text();
        validFiles.push({
          file,
          preview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          type: 'game'
        });
      } else if (isValidAsset) {
        // Create preview URL for images
        const previewUrl = URL.createObjectURL(file);
        validFiles.push({
          file,
          preview: previewUrl,
          type: 'asset'
        });
      } else {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        });
      }
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    
    // Auto-fill form name if not set
    if (!form.name && validFiles.length > 0) {
      const mainFile = validFiles.find(f => f.type === 'game');
      if (mainFile) {
        const nameWithoutExt = mainFile.file.name.split('.').slice(0, -1).join('.');
        setForm(prev => ({ ...prev, name: nameWithoutExt }));
      }
    }
  }, [form.name]);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview && newFiles[index].type === 'asset') {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const downloadTemplate = (template: GameTemplate) => {
    const filename = template.requiredFiles?.[0] || `${template.id}.${template.type === 'html' ? 'html' : template.type === 'javascript' ? 'js' : 'tsx'}`;
    const blob = new Blob([template.template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Auto-fill form with template information
    setForm(prev => ({
      ...prev,
      name: template.name,
      category: template.category,
      description: template.description,
      instructions: template.instructions
    }));
    
    // Create a file from the template and add it to uploaded files
    const file = new File([template.template], filename, { type: 'text/plain' });
    const gameFile: GameFile = {
      file,
      preview: template.template.substring(0, 200) + '...',
      type: 'game'
    };
    setUploadedFiles([gameFile]);
    
    // Move to upload tab to show the file
    setCurrentTab('upload');
    
    toast({
      title: "Template downloaded!",
      description: `${template.name} has been downloaded and added to your files`,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleInstallGame = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one game file",
        variant: "destructive"
      });
      return;
    }

    if (!form.name) {
      toast({
        title: "Game name required",
        description: "Please enter a name for your game",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      // Add files to form data
      uploadedFiles.forEach(gameFile => {
        formData.append('gameFiles', gameFile.file);
      });
      
      // Add game metadata
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('instructions', form.instructions);
      formData.append('winChance', form.winChance.toString());
      formData.append('maxMultiplier', form.maxMultiplier.toString());
      formData.append('minBet', form.minBet);
      formData.append('maxBet', form.maxBet);
      formData.append('tags', form.tags.join(','));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch('/api/admin/games/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Game installed successfully!",
        description: `${form.name} has been added to your casino platform`,
      });

      // Reset form and files
      setForm({
        name: '',
        category: 'casino',
        description: '',
        instructions: '',
        winChance: 50,
        maxMultiplier: 2.0,
        minBet: '1',
        maxBet: '1000',
        tags: []
      });
      setUploadedFiles([]);
      setCurrentTab('upload');
      
      onGameInstalled();
      
    } catch (error: any) {
      toast({
        title: "Installation failed",
        description: error.message || "Failed to install game",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return <FileText className="h-4 w-4" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="h-4 w-4" />;
      case 'css':
        return <Settings className="h-4 w-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
      case 'gif':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6" />
          Game Installer
        </CardTitle>
        <CardDescription>
          Upload and install new games to your casino platform. Supports HTML, JavaScript, TypeScript, and React components.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">Game Templates</TabsTrigger>
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="configure">Configure Game</TabsTrigger>
            <TabsTrigger value="preview">Preview & Install</TabsTrigger>
          </TabsList>
          
          {/* Game Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Game Templates & Examples
                </h3>
                <Select value={templateFilter} onValueChange={(value: any) => setTemplateFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Professional Game Templates</p>
                    <p>These templates create games that work exactly like our built-in games (Slots, Dice, Plinko). They include proper API integration, balance updates, animations, and the same user experience as existing casino games.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameTemplates
                  .filter(template => templateFilter === 'all' || template.difficulty === templateFilter)
                  .map(template => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Badge variant={template.difficulty === 'beginner' ? 'default' : 
                                           template.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
                              {template.difficulty}
                            </Badge>
                            <Badge variant="outline">{template.type}</Badge>
                          </div>
                        </div>
                        <CardDescription className="text-sm">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <div className="space-y-2 border-t pt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCodePreview(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Code
                              </Button>
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadTemplate(template);
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Use This Template
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {selectedTemplate && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      Instructions for {selectedTemplate.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border">
                        {selectedTemplate.instructions}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Template code preview modal/dialog could go here */}
              {showCodePreview && selectedTemplate && (
                <Card className="bg-gray-900 text-green-400">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        {selectedTemplate.name} - Source Code
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowCodePreview(false)}
                        className="text-white hover:bg-gray-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="text-xs leading-relaxed whitespace-pre-wrap">
                        {selectedTemplate.template}
                      </pre>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTemplate.template);
                          toast({
                            title: "Code copied!",
                            description: "Template code has been copied to your clipboard",
                          });
                        }}
                      >
                        Copy Code
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => downloadTemplate(selectedTemplate)}
                      >
                        Download as File
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-primary">
                      Click to upload
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </Label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".html,.htm,.js,.jsx,.ts,.tsx,.css,.json,.png,.jpg,.jpeg,.webp,.gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Supported: HTML, JS, JSX, TS, TSX, CSS, JSON, Images
                </p>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
                <div className="grid gap-2">
                  {uploadedFiles.map((gameFile, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(gameFile.file.name)}
                        <div>
                          <p className="font-medium text-sm">{gameFile.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(gameFile.file.size / 1024).toFixed(1)} KB • {gameFile.type}
                          </p>
                        </div>
                        {index === 0 && (
                          <Badge variant="outline">Main File</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="flex justify-end">
                <Button onClick={() => setCurrentTab('configure')}>
                  Next: Configure Game
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Configure Tab */}
          <TabsContent value="configure" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="game-name">Game Name *</Label>
                  <Input
                    id="game-name"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter game name"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category} onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the game"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">How to Play</Label>
                  <Textarea
                    id="instructions"
                    value={form.instructions}
                    onChange={(e) => setForm(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Instructions for players"
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="win-chance">Win Chance (%)</Label>
                    <Input
                      id="win-chance"
                      type="number"
                      min="1"
                      max="99"
                      value={form.winChance}
                      onChange={(e) => setForm(prev => ({ ...prev, winChance: parseFloat(e.target.value) || 50 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-multiplier">Max Multiplier</Label>
                    <Input
                      id="max-multiplier"
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={form.maxMultiplier}
                      onChange={(e) => setForm(prev => ({ ...prev, maxMultiplier: parseFloat(e.target.value) || 2.0 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-bet">Min Bet</Label>
                    <Input
                      id="min-bet"
                      type="number"
                      min="0.01"
                      value={form.minBet}
                      onChange={(e) => setForm(prev => ({ ...prev, minBet: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-bet">Max Bet</Label>
                    <Input
                      id="max-bet"
                      type="number"
                      min="1"
                      value={form.maxBet}
                      onChange={(e) => setForm(prev => ({ ...prev, maxBet: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentTab('upload')}>
                Back: Upload Files
              </Button>
              <Button onClick={() => setCurrentTab('preview')}>
                Next: Preview & Install
              </Button>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-semibold mb-4">Game Installation Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Game Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{form.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Category:</dt>
                      <dd>{categories.find(c => c.value === form.category)?.label}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Files:</dt>
                      <dd>{uploadedFiles.length} files</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Win Chance:</dt>
                      <dd>{form.winChance}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Max Multiplier:</dt>
                      <dd>{form.maxMultiplier}x</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Bet Range:</dt>
                      <dd>{form.minBet} - {form.maxBet}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Files to Install</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((gameFile, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {getFileIcon(gameFile.file.name)}
                        <span className="truncate">{gameFile.file.name}</span>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">Main</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {form.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {form.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {form.description && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{form.description}</p>
                </div>
              )}

              {form.instructions && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Instructions</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{form.instructions}</p>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Installing game...</span>
                  <span className="text-sm text-gray-500">{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentTab('configure')}>
                Back: Configure
              </Button>
              <Button 
                onClick={handleInstallGame} 
                disabled={isUploading || uploadedFiles.length === 0 || !form.name}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Install Game
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}