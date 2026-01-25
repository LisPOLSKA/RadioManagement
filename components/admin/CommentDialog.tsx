"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { ConvexError } from "convex/values";
import { useTranslations } from "next-intl";
import { Input } from "../ui/input";

type Props = {
  userId: Id<"users">;
  initialComment?: string;
  open?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
};

export default function UserCommentDialog({
  userId,
  initialComment = "",
  open,
  onClose,
  hideTrigger,
}: Props) {
  const [comment, setComment] = useState(initialComment);
  const [saving, setSaving] = useState(false);

  const setCommentMutation = useMutation(api.users.setComment);

  const t = useTranslations("Errors");
  const tUI = useTranslations("UI");

  useEffect(() => {
    setComment(initialComment);
  }, [initialComment]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await setCommentMutation({
        userId,
        comment,
      });

      toast.success(tUI("commentSaved"));
      onClose?.();
    } catch (e) {
      if (e instanceof ConvexError) {
        toast.error(t(e.data));
      } else {
        toast.error(tUI("saveFailed"));
        console.error(e);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose?.()}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            {tUI("editComment")}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="w-[min(90%,32rem)] sm:mx-auto p-4">
        <DialogHeader>
          <DialogTitle>{tUI("editUserComment")}</DialogTitle>
          <p className="text-sm text-gray-500">
            {tUI("commentVisibleForAdmins")}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1">{tUI("comment")}</Label>
            <Input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={tUI("commentPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {tUI("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {tUI("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
