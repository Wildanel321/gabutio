'use client';

import { useEffect, useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, Trophy, Medal, Award } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [topUsers, setTopUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    const interval = setInterval(() => {
      updateRanks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    await updateRanks();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('xp', { ascending: false })
      .limit(50);

    if (!error && data) {
      setTopUsers(data);
    }
    setLoading(false);
  };

  const updateRanks = async () => {
    await supabase.rpc('update_user_ranks');
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-slate-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top meme creators ranked by XP</p>
        </div>

        {topUsers.slice(0, 3).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {topUsers.slice(0, 3).map((user, index) => (
              <Link key={user.id} href={`/profile/${user.id}`}>
                <Card className={`hover:shadow-lg transition-shadow ${
                  index === 0 ? 'md:col-start-2 md:row-start-1 border-yellow-500/50' : ''
                } ${index === 1 ? 'md:col-start-1 md:row-start-2' : ''} ${
                  index === 2 ? 'md:col-start-3 md:row-start-2' : ''
                }`}>
                  <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-4">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                      <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                      <AvatarFallback className="text-2xl">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg mb-1">{user.username}</h3>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Badge variant={getRankBadgeVariant(index + 1)}>
                        Rank #{index + 1}
                      </Badge>
                      <Badge variant="secondary">Level {user.level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.xp} XP</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topUsers.map((user, index) => (
                <Link key={user.id} href={`/profile/${user.id}`}>
                  <div className={`flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors ${
                    index < 3 ? 'bg-muted/50' : ''
                  }`}>
                    <div className="flex items-center justify-center w-12">
                      {index < 3 ? (
                        getRankIcon(index + 1)
                      ) : (
                        <span className="text-xl font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                      <AvatarFallback>
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">Level {user.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{user.xp}</p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
