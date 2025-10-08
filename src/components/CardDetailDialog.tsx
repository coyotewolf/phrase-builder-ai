import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card as VocabCard } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Volume2 } from "lucide-react";
import { playPronunciation } from "@/lib/tts";
import { Button } from "@/components/ui/button";

interface CardDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: VocabCard | null;
}

export function CardDetailDialog({ open, onOpenChange, card }: CardDetailDialogProps) {
  if (!card) return null;

  const handleSpeak = () => {
    if (card.headword) {
      playPronunciation(card.headword, 'en-US');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl font-bold">{card.headword}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSpeak}
              className="h-8 w-8 p-0"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
          {card.phonetic && (
            <p className="text-sm text-muted-foreground">{card.phonetic}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Meanings */}
          {card.meanings && card.meanings.length > 0 && (
            <div className="space-y-4">
              {card.meanings.map((meaning, idx) => (
                <div key={idx} className="space-y-3 pb-4 border-b last:border-0">
                  {/* Part of Speech */}
                  {meaning.part_of_speech && (
                    <Badge variant="secondary" className="text-xs">
                      {meaning.part_of_speech}
                    </Badge>
                  )}

                  {/* Meanings */}
                  <div className="space-y-2">
                    {meaning.meaning_zh && (
                      <p className="text-base">
                        <span className="font-semibold">中文：</span>
                        {meaning.meaning_zh}
                      </p>
                    )}
                    {meaning.meaning_en && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">English：</span>
                        {meaning.meaning_en}
                      </p>
                    )}
                  </div>

                  {/* Examples */}
                  {meaning.examples && meaning.examples.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground">例句：</p>
                      <ul className="space-y-1 pl-4">
                        {meaning.examples.map((example, exIdx) => (
                          <li key={exIdx} className="text-sm text-muted-foreground list-disc">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Synonyms */}
                  {meaning.synonyms && meaning.synonyms.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground">同義詞：</p>
                      <div className="flex flex-wrap gap-2">
                        {meaning.synonyms.map((synonym, synIdx) => (
                          <Badge key={synIdx} variant="outline" className="text-xs">
                            {synonym}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Antonyms */}
                  {meaning.antonyms && meaning.antonyms.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground">反義詞：</p>
                      <div className="flex flex-wrap gap-2">
                        {meaning.antonyms.map((antonym, antIdx) => (
                          <Badge key={antIdx} variant="outline" className="text-xs">
                            {antonym}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {card.notes && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">筆記：</p>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{card.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
