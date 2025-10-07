import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card as VocabCard } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: VocabCard | null;
  onSave: (updates: Partial<VocabCard>) => void;
}

export function EditCardDialog({
  open,
  onOpenChange,
  card,
  onSave,
}: EditCardDialogProps) {
  const [headword, setHeadword] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [meaningZh, setMeaningZh] = useState("");
  const [meaningEn, setMeaningEn] = useState("");
  const [notes, setNotes] = useState("");
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [antonyms, setAntonyms] = useState<string[]>([]);
  const [examples, setExamples] = useState<string[]>([]);
  const [newSynonym, setNewSynonym] = useState("");
  const [newAntonym, setNewAntonym] = useState("");
  const [newExample, setNewExample] = useState("");

  useEffect(() => {
    if (card) {
      setHeadword(card.headword || "");
      setPhonetic(card.phonetic || "");
      setPartOfSpeech(card.part_of_speech || "");
      setMeaningZh(card.meaning_zh || "");
      setMeaningEn(card.meaning_en || "");
      setNotes(card.notes || "");
      setSynonyms(card.detail?.synonyms || []);
      setAntonyms(card.detail?.antonyms || []);
      setExamples(card.detail?.examples || []);
    }
  }, [card]);

  const handleSave = () => {
    onSave({
      headword,
      phonetic,
      part_of_speech: partOfSpeech,
      meaning_zh: meaningZh,
      meaning_en: meaningEn,
      notes,
      detail: {
        synonyms,
        antonyms,
        examples,
        ipa: phonetic,
        level: card?.detail?.level,
      },
    });
    onOpenChange(false);
  };

  const addSynonym = () => {
    if (newSynonym.trim()) {
      setSynonyms([...synonyms, newSynonym.trim()]);
      setNewSynonym("");
    }
  };

  const addAntonym = () => {
    if (newAntonym.trim()) {
      setAntonyms([...antonyms, newAntonym.trim()]);
      setNewAntonym("");
    }
  };

  const addExample = () => {
    if (newExample.trim()) {
      setExamples([...examples, newExample.trim()]);
      setNewExample("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Word Card</DialogTitle>
          <DialogDescription>
            Update the word details and related information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headword">Headword *</Label>
              <Input
                id="headword"
                value={headword}
                onChange={(e) => setHeadword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phonetic">Phonetic / IPA</Label>
              <Input
                id="phonetic"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/example/"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pos">Part of Speech</Label>
            <Input
              id="pos"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder="noun, verb, adjective..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meaning-zh">Chinese Meaning</Label>
            <Textarea
              id="meaning-zh"
              value={meaningZh}
              onChange={(e) => setMeaningZh(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meaning-en">English Definition</Label>
            <Textarea
              id="meaning-en"
              value={meaningEn}
              onChange={(e) => setMeaningEn(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Synonyms</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {synonyms.map((syn, idx) => (
                <Badge key={idx} variant="secondary">
                  {syn}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setSynonyms(synonyms.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSynonym}
                onChange={(e) => setNewSynonym(e.target.value)}
                placeholder="Add synonym"
                onKeyPress={(e) => e.key === "Enter" && addSynonym()}
              />
              <Button type="button" onClick={addSynonym}>Add</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Antonyms</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {antonyms.map((ant, idx) => (
                <Badge key={idx} variant="secondary">
                  {ant}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => setAntonyms(antonyms.filter((_, i) => i !== idx))}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAntonym}
                onChange={(e) => setNewAntonym(e.target.value)}
                placeholder="Add antonym"
                onKeyPress={(e) => e.key === "Enter" && addAntonym()}
              />
              <Button type="button" onClick={addAntonym}>Add</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Example Sentences</Label>
            <div className="space-y-2 mb-2">
              {examples.map((ex, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded">
                  <p className="flex-1 text-sm">{ex}</p>
                  <X
                    className="h-4 w-4 cursor-pointer mt-1"
                    onClick={() => setExamples(examples.filter((_, i) => i !== idx))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                placeholder="Add example sentence"
                rows={2}
              />
              <Button type="button" onClick={addExample} className="self-end">Add</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes or usage tips"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
