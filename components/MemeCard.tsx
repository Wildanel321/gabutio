'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { Meme } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

type MemeCardProps = {
  meme: Meme;
  onLike: (memeId: string) => void;
  onUnlike: (memeId: string) => void;
  onDelete?: (memeId: string) => void;
  onCommentClick?: (memeId: string) => void;
};

export default function MemeCard({ meme, onLike, onUnlike, onDelete, onCommentClick }: MemeCardProps) {
  const { user } = useAuth();
  const [imageLoading, setImageLoading] = useState(true);
  const isOwner = user?.id === meme.user_id;

  const handleLikeClick = () => {
    if (meme.user_liked) {
      onUnlike(meme.id);
    } else {
      onLike(meme.id);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Link href={`/profile/${meme.user_id}`} className="flex items-center gap-3 hover:opacity-80">
            <Avatar>
              <AvatarImage src={meme.profiles?.avatar_url || ''} alt={meme.profiles?.username} />
              <AvatarFallback>
                {meme.profiles?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{meme.profiles?.username}</p>
              <p className="text-xs text-muted-foreground">
                Level {meme.profiles?.level}
                {meme.profiles?.rank && meme.profiles.rank <= 10 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    #{meme.profiles.rank}
                  </Badge>
                )}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(meme.created_at), { addSuffix: true })}
            </span>
            {isOwner && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete(meme.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full bg-muted" style={{ minHeight: '300px' }}>
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
          <Image
            src={meme.image_url}
            alt={meme.caption || 'Meme'}
            width={800}
            height={800}
            className="w-full h-auto object-contain"
            onLoad={() => setImageLoading(false)}
            priority={false}
          />
        </div>
        {meme.caption && (
          <div className="p-4">
            <p className="text-sm">{meme.caption}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-4 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLikeClick}
          className={meme.user_liked ? 'text-red-500' : ''}
        >
          <Heart className={`h-5 w-5 mr-2 ${meme.user_liked ? 'fill-current' : ''}`} />
          {meme.likes_count}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCommentClick?.(meme.id)}
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          {meme.comments_count}
        </Button>
      </CardFooter>
    </Card>
  );
}
