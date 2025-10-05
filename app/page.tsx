'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Meme } from '@/lib/supabase';
import Header from '@/components/Header';
import MemeCard from '@/components/MemeCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CommentSection from '@/components/CommentSection';
import { toast } from 'sonner';
import { Loader as Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MEMES_PER_PAGE = 10;

export default function Home() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedMemeId, setSelectedMemeId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMemes(0);
    }
  }, [user]);

  const fetchMemes = async (pageNum: number) => {
    setLoading(true);
    const from = pageNum * MEMES_PER_PAGE;
    const to = from + MEMES_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('memes')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      if (data.length < MEMES_PER_PAGE) {
        setHasMore(false);
      }

      const memesWithLikes = await Promise.all(
        data.map(async (meme) => {
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('meme_id', meme.id)
            .eq('user_id', user?.id)
            .maybeSingle();

          return {
            ...meme,
            user_liked: !!likeData,
          };
        })
      );

      if (pageNum === 0) {
        setMemes(memesWithLikes);
      } else {
        setMemes((prev) => [...prev, ...memesWithLikes]);
      }
    }
    setLoading(false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMemes(nextPage);
  };

  const handleLike = async (memeId: string) => {
    const { error } = await supabase
      .from('likes')
      .insert({
        meme_id: memeId,
        user_id: user?.id,
      });

    if (!error) {
      setMemes((prev) =>
        prev.map((meme) =>
          meme.id === memeId
            ? { ...meme, likes_count: meme.likes_count + 1, user_liked: true }
            : meme
        )
      );
      toast.success('Liked! +2 XP');
      await refreshProfile();
    }
  };

  const handleUnlike = async (memeId: string) => {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('meme_id', memeId)
      .eq('user_id', user?.id);

    if (!error) {
      setMemes((prev) =>
        prev.map((meme) =>
          meme.id === memeId
            ? { ...meme, likes_count: meme.likes_count - 1, user_liked: false }
            : meme
        )
      );
      await refreshProfile();
    }
  };

  const handleDelete = async (memeId: string) => {
    const { error } = await supabase
      .from('memes')
      .delete()
      .eq('id', memeId);

    if (!error) {
      setMemes((prev) => prev.filter((meme) => meme.id !== memeId));
      toast.success('Meme deleted');
    } else {
      toast.error('Failed to delete meme');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Latest Memes</h1>

        {loading && page === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : memes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No memes yet. Be the first to upload!</p>
            <Button onClick={() => router.push('/upload')}>Upload Meme</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {memes.map((meme) => (
              <MemeCard
                key={meme.id}
                meme={meme}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onDelete={handleDelete}
                onCommentClick={setSelectedMemeId}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button onClick={handleLoadMore} disabled={loading} variant="outline">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={!!selectedMemeId} onOpenChange={() => setSelectedMemeId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          {selectedMemeId && <CommentSection memeId={selectedMemeId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
