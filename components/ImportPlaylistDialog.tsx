// "use client";

// import { useState } from "react";
// import { useAction, useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Plus } from "lucide-react";
// import { toast } from "sonner";
// import { ConvexError } from "convex/values";
// import { useTranslations } from "next-intl";
// import CategoryDropdown from "@/components/CategoryDropdown";

// export default function ImportPlaylistDialog() {
//   const [open, setOpen] = useState(false);
//   const [playlistUrl, setPlaylistUrl] = useState("");
//   const [category, setCategory] = useState("Other");
//   const [isImporting, setIsImporting] = useState(false);

//   const fetchYoutubePlaylist = useAction(api.youtube.fetchYoutubePlaylist);
//   const importPlaylist = useMutation(api.playlists.importPlaylistFromYoutube);

//   const t = useTranslations("Errors");
//   const tUI = useTranslations("UI");

//   async function handleImport(e: React.FormEvent) {
//     e.preventDefault();

//     if (!playlistUrl.trim()) {
//       toast.error(tUI("fillAllFields"));
//       return;
//     }

//     try {
//       setIsImporting(true);
//       const youtubePlaylist = await fetchYoutubePlaylist({ playlistUrl: playlistUrl.trim() });
//       const playlist = await importPlaylist({ playlist: youtubePlaylist, category });
//       toast.success(`${tUI("playlistImported")}: ${playlist?.title || tUI("playlists")}`);
//       setPlaylistUrl("");
//       setCategory("Other");
//       setOpen(false);
//     } catch (error) {
//       if (error instanceof ConvexError) {
//         toast.error(t(error.data));
//       } else {
//         toast.error("Failed to import playlist");
//         console.error(error);
//       }
//     } finally {
//       setIsImporting(false);
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button variant="outline">
//           <Plus className="mr-2 h-4 w-4" />
//           {tUI("importPlaylist")}
//         </Button>
//       </DialogTrigger>

//       <DialogContent className="sm:max-w-lg">
//         <DialogHeader>
//           <DialogTitle>{tUI("importPlaylist")}</DialogTitle>
//         </DialogHeader>

//         <form className="grid gap-4 py-2" onSubmit={handleImport}>
//           <div className="grid gap-2">
//             <Label htmlFor="playlistUrl">{tUI("youtubePlaylistUrl")}</Label>
//             <Input
//               id="playlistUrl"
//               value={playlistUrl}
//               onChange={(e) => setPlaylistUrl(e.target.value)}
//               placeholder="https://www.youtube.com/playlist?list=..."
//               required
//             />
//           </div>

//           <CategoryDropdown selectedCategory={category} onChange={setCategory} />

//           <DialogFooter>
//             <Button type="submit" disabled={isImporting}>
//               {isImporting ? tUI("importingPlaylist") : tUI("importPlaylist")}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }