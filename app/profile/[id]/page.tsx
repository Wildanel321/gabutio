'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Profile, Meme } from '@/lib/supabase';
import Header from '@/components/Header';
import MemeCard from '@/components/MemeCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, Trophy, Image as ImageIcon, MessageCircle, Heart, CreditCard as Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CommentSection from '@/components/CommentSection';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemeId, setSelectedMemeId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwnProfile = user?.id === params.id;

  useEffect(() => {
    fetchProfile();
    fetchMemes();
  }, [params.id]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      setEditUsername(data.username);
      setEditBio(data.bio || '');
    }
    setLoading(false);
  };

  const fetchMemes = async () => {
    const { data, error } = await supabase
      .from('memes')
      .select('*, profiles(*)')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
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
      setMemes(memesWithLikes);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        username: editUsername,
        bio: editBio,
      })
      .eq('id', params.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      setEditMode(false);
      await fetchProfile();
      await refreshProfile();
    }
    setSaving(false);
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
      await fetchProfile();
    } else {
      toast.error('Failed to delete meme');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto py-8 px-4 text-center">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                <AvatarFallback className="text-3xl">
                  {profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                {editMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        disabled={saving}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold">{profile.username}</h1>
                      {profile.rank && profile.rank <= 10 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          #{profile.rank}
                        </Badge>
                      )}
                    </div>
                    {profile.bio && (
                      <p className="text-muted-foreground">{profile.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold">Level {profile.level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">XP:</span>
                        <span className="font-semibold">{profile.xp}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{memes.length} memes</span>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            {isOwnProfile ? 'Your Memes' : `${profile.username}'s Memes`}
          </h2>
          {memes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No memes yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {memes.map((meme) => (
                <MemeCard
                  key={meme.id}
                  meme={meme}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onDelete={isOwnProfile ? handleDelete : undefined}
                  onCommentClick={setSelectedMemeId}
                />
              ))}
            </div>
          )}
        </div>
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
