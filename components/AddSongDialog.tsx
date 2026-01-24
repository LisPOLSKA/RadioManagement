"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import AddSongForm from "./AddSongForm";
import { useTranslations } from "next-intl";

export default function AddSongDialog() {
  const t = useTranslations("UI");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
            {t("addSong")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addNewSongs")}</DialogTitle>
        </DialogHeader>

        <AddSongForm />
      </DialogContent>
    </Dialog>
  );
}
