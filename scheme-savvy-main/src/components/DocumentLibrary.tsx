import { useState, useEffect } from "react";
import { FileText, Upload, CheckCircle, Clock, ChevronDown, ChevronUp, Database, Trash2, RefreshCw, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getDocuments, deleteDocument, uploadDocument, IndexedDocument } from "@/lib/api/chat";

// ... (keep existing code)


import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, string> = {
  Housing: "bg-primary/10 text-primary",
  Education: "bg-blue-500/10 text-blue-600",
  Healthcare: "bg-green-500/10 text-green-600",
  Health: "bg-green-500/10 text-green-600",
  Agriculture: "bg-amber-500/10 text-amber-600",
  Employment: "bg-purple-500/10 text-purple-600",
  "Women & Child": "bg-pink-500/10 text-pink-600",
  General: "bg-gray-500/10 text-gray-600",
};

export function DocumentLibrary() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [documents, setDocuments] = useState<IndexedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []); // Fetch on mount to show stats in header immediately

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast({
        title: "Document removed",
        description: "The document has been removed from the knowledge base.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "Could not remove the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunkCount || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: "Processing document",
      description: "Extracting text and indexing content... This may take a moment.",
    });

    try {
      await uploadDocument(file);
      toast({
        title: "Upload successful",
        description: "Document has been indexed and added to the knowledge base.",
      });
      // Small delay to allow backend to process
      setTimeout(() => fetchDocuments(), 1000);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload document.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl shadow-soft overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-sm text-foreground">Knowledge Base</h3>
            <p className="text-xs text-muted-foreground">
              {documents.length} documents • {totalChunks.toLocaleString()} chunks indexed
              {documents.length === 0 && !isLoading && " • Self-updating via web search"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {isExpanded ? "Hide" : "Show"} documents
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border/50 animate-fade-in">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "m-4 p-6 border-2 border-dashed rounded-xl transition-all text-center",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/50"
            )}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">
              Upload Government PDF
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Drag & drop or click to browse
            </p>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              id="pdf-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
                e.target.value = '';
              }}
            />
            <Button variant="outline" size="sm" onClick={() => document.getElementById('pdf-upload')?.click()} disabled={isLoading}>
              <Upload className="w-3 h-3 mr-2" />
              {isLoading ? "Processing..." : "Select PDF"}
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2">
              Only official government documents will be processed
            </p>
          </div>

          {/* Document List */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Indexed Documents
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDocuments}
                disabled={isLoading}
                className="h-7 text-xs"
              >
                <RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 text-muted-foreground mx-auto animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">Self-Updating Knowledge Base</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  When you ask a question, the system automatically searches official government portals and indexes relevant content.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center border border-border/50">
                      {doc.source_type === 'web' ? (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            categoryColors[doc.category] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {doc.chunkCount} chunks
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          • {doc.domain}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-[10px] font-medium hidden sm:block">Indexed</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Footer */}
          {documents.length > 0 && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{documents.length}</p>
                  <p className="text-[10px] text-muted-foreground">Documents</p>
                </div>
                <div className="text-center border-x border-border/50">
                  <p className="text-lg font-semibold text-foreground">
                    {documents.filter(d => d.source_type === 'web').length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">From Web</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{totalChunks.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Chunks</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
