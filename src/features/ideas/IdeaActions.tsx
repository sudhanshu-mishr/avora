'use client';
import { useTransition } from 'react';
import { Heart, Bookmark, Trash2 } from 'lucide-react';
import { toggleFollow, toggleBookmark } from '@/features/social/actions';
import { deleteIdea } from './actions';
import { Button } from '@/components/ui/button';

export default function IdeaActions({ ideaId, ownerId, isOwner }: {
  ideaId: string; ownerId: string; isOwner: boolean;
}) {
  const [, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => start(() => toggleFollow(ownerId))}>
        <Heart size={16} /> Follow
      </Button>
      <Button size="sm" variant="outline" onClick={() => start(() => toggleBookmark('idea', ideaId))}>
        <Bookmark size={16} /> Save
      </Button>
      {isOwner && (
        <Button size="sm" variant="danger" onClick={() => { if (confirm('Delete this idea?')) start(() => deleteIdea(ideaId)); }}>
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}